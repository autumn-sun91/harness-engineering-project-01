# Step 0: db-contract-rpcs

## 읽어야 할 파일

먼저 아래 파일들을 읽고 설계 의도와 기존 코드를 파악하라:

- `/docs/ARCHITECTURE.md` — 특히 "데이터 접근 계약"과 RPC 표(`transition_upload`, `claim_analysis_retry`, `mark_stale_upload`, `get_upload_report`)
- `/docs/ADR.md` — ADR-010(dual-scope 생성 + DB RPC 트리밍)
- `/plan.md` — §1 Free/Pro 경계와 scope 정의, §4 DB 스키마와 접근 계약, §6 공통 인터페이스
- `/supabase/migrations/0005_supabase_schema.sql` — 기존 4테이블·RLS·`reserve_upload()`·`handle_new_user()`
- `/supabase/migrations/0006_billing.sql` — `sync_polar_subscription()`
- `/src/types/api.ts`, `/src/types/analysis.ts` — `UploadReport`, `TrimmedReportSection`, `Aggregates`, `Interpretation`
- `/src/lib/analysis/process-upload.ts` (226~240행) — `analysis_results.payload`에 실제로 저장되는 구조
- `/src/lib/analysis/analysis-repository.ts` (131~137행) — `transition_upload` 호출부
- `/src/app/api/uploads/[id]/route.ts` (105~133행) — `mark_stale_upload`, `get_upload_report` 호출부
- `/src/app/api/analyze/[id]/retry/route.ts` (60~77행) — `claim_analysis_retry` 호출부

## 배경

애플리케이션 코드는 RPC 6개를 호출하지만 마이그레이션에는 3개(`reserve_upload`, `handle_new_user`, `sync_polar_subscription`)만 정의되어 있다. 아래 4개가 **호출만 되고 구현되지 않았다.**

| 호출되는 RPC | 호출 위치 |
|---|---|
| `get_upload_report` | `src/app/api/uploads/[id]/route.ts:129`, `src/app/(dashboard)/dashboard/page.tsx:163` |
| `transition_upload` | `src/lib/analysis/analysis-repository.ts:131` |
| `mark_stale_upload` | `src/app/api/uploads/[id]/route.ts:110` |
| `claim_analysis_retry` | `src/app/api/analyze/[id]/retry/route.ts:60` |

마이그레이션 SQL은 `npm run lint`·`build`·`test` 어디서도 실행되지 않고 Supabase 클라이언트는 테스트에서 전부 모킹되므로 이 불일치가 드러나지 않았다. 이 step은 그 4개를 구현하고 SQL 레벨 테스트로 검증한다.

## 작업

### 1. `supabase/migrations/0007_upload_contract_rpcs.sql` 생성

기존 마이그레이션은 **수정하지 말고** 새 파일에 append-only로 작성하라. `0005`를 편집하면 그 위에 쌓인 `0006`과 어긋난다.

**1-1. status 어휘를 정본으로 교정한다.**

현재 `csv_uploads.status` check는 `('uploading','parsing','analyzing','completed','failed')`이지만 정본(`plan.md` §6 `UploadStatus`)은 다음 6개다:

```
queued | parsing | analyzing | partial | completed | failed
```

`uploading`을 제거하고 `queued`와 `partial`을 추가한다. `partial`은 "해석만 실패하면 결정론적 집계를 저장하고 partial 상태로 둔다"는 요구사항에 필수이며 현재 DB에 아예 없다. 컬럼 default도 `'queued'`로 바꾼다. 기존 행이 있다면 `'uploading'`을 `'queued'`로 갱신한 뒤 제약을 건다.

`reserve_upload()`는 `0005`에서 `status in ('uploading','parsing','analyzing')`로 active를 판정하고 default에 의존해 insert하므로, **새 어휘에 맞춰 `create or replace`로 재정의하라.** active 판정은 `('queued','parsing','analyzing')`이 된다. 월 한도 계산(Asia/Seoul, `status <> 'failed'`), 동시 1건 검사, `for update` 잠금, 반환 형태 `returns table (upload_id uuid, error_code text)`는 기존 동작을 그대로 유지하라.

**1-2. RPC 4개를 구현한다.**

4개 모두 다음 공통 규칙을 적용한다. `0005`의 `reserve_upload`가 같은 패턴을 쓰고 있으니 그대로 따르라.

- `language plpgsql`, `security definer`, `set search_path = ''` (모든 객체를 `public.`으로 정규화)
- 함수 본문 첫 부분에서 `auth.uid()`로 소유권 검사. 소유자가 아니면 데이터를 반환하지 않는다.
- `revoke execute ... from public;` 후 `grant execute ... to authenticated;`

```sql
-- 호출부가 기대하는 시그니처. 인자 이름을 그대로 지켜라(named argument로 호출된다).
transition_upload(upload_id uuid, expected_status text, next_status text, metadata jsonb) returns void
claim_analysis_retry(upload_id uuid) returns table (upload_id uuid, retry_count integer, error_code text)
mark_stale_upload(upload_id uuid) returns void
get_upload_report(upload_id uuid) returns jsonb
```

**`transition_upload`** — 대상 행을 `for update`로 잠그고 현재 status가 `expected_status`와 같을 때만 전이한다. 허용 전이는 `queued→parsing→analyzing→(completed|partial|failed)`이며, 어느 active 상태에서든 `failed`로는 갈 수 있다. 종료 상태(`completed|partial|failed`)에서 밖으로 나가는 전이는 거부한다. `metadata` jsonb에서 갱신을 허용하는 키는 `row_count`, `skipped_row_count`, `error_code`, `scope_start`, `scope_end`, `currency`, `started_at`, `completed_at`뿐이다. **그 외 키는 무시하라. 이유: 클라이언트가 보낸 jsonb를 그대로 컬럼에 반영하면 `user_id`나 `retry_count` 같은 필드를 조작할 수 있다.**

**`claim_analysis_retry`** — 소유자·retry 가능 상태(`partial` 또는 `failed`)·`retry_count < 3`을 **하나의 잠금 안에서** 원자적으로 검사하고 `retry_count`를 1 증가시킨 뒤 status를 `analyzing`으로 되돌린다. 상한 초과는 `error_code = 'retry_limit_exceeded'`, 소유자가 아니거나 없는 id는 `'not_found'`, 재시도 불가 상태는 `'analysis_in_progress'`를 반환한다. 성공 시 `error_code`는 null이고 `upload_id`가 채워진다. **호출부(`retry/route.ts:65-77`)는 `error_code`가 있으면 그것으로 분기하고 없으면 `upload_id`를 요구하므로 두 컬럼을 반드시 채워라.**

**`mark_stale_upload`** — 소유자의 행 중 status가 `('queued','parsing','analyzing')`이고 `uploaded_at`이 10분을 초과한 것만 `failed` + `error_code='analysis_timeout'`으로 전환한다. 조건에 맞지 않으면 아무것도 하지 않는다(에러를 던지지 마라 — 조회 경로에서 매번 호출된다).

**`get_upload_report`** — 이 프로젝트의 **유료 게이팅을 담당하는 유일한 지점**이다.

1. `auth.uid()`가 해당 upload의 소유자인지 확인한다. 아니면 `null`을 반환한다.
2. `subscriptions`에서 effective plan을 판정한다. **`plan = 'pro'`이고 `current_period_end >= now()`일 때만 Pro다.** `cancel_at_period_end = true`여도 기간 종료 전이면 Pro다. 구독 행이 없으면 Free로 간주한다.
3. `analysis_results.payload`는 다음 구조로 저장되어 있다(`process-upload.ts:232-238` 참조):

```jsonc
{
  "schemaVersion": 1,
  "scopes": {
    "recent12m": { "aggregates": { ... }, "interpretation": { "summary": "...", "savings": [...], "anomalies": [...] } | null },
    "full":      { "aggregates": { ... }, "interpretation": { ... } | null }
  },
  "usage": { "inputTokens": 0, "outputTokens": 0, "model": "..." }
}
```

4. Pro면 `scopes.full`을, Free면 `scopes.recent12m`을 **선택한다.** 선택하지 않은 scope와 `usage`는 반환 JSON에 **존재해서는 안 된다.**
5. 반환 형태는 `src/types/api.ts`의 `UploadReport`와 정확히 일치해야 한다:

```jsonc
{
  "scope": "recent12m" | "full",
  "aggregates": { /* 선택된 scope의 aggregates 그대로 */ },
  "interpretation": {
    "summary": "...",
    "savings":   { "items": [...], "totalCount": 0, "locked": false },
    "anomalies": { "items": [...], "totalCount": 0, "locked": false }
  } | null
}
```

저장된 `interpretation.savings`/`anomalies`는 **평범한 배열**이지만 반환값은 `{items, totalCount, locked}` 형태여야 한다. `totalCount`는 **자르기 전 원본 개수**다.

6. Free 티저 규칙: `anomalies.items`는 최대 3개, `savings.items`는 최대 1개, 둘 다 `locked = true`. Pro는 전부 반환하고 `locked = false`.
7. `analysis_results` 행이 없으면(아직 분석 중이거나 실패) `null`을 반환한다.

**잘라낸 배열 원소는 반환 JSON에 절대 남기지 마라. 이유: 이 함수가 자르지 않으면 Free 사용자가 응답 본문에서 유료 데이터를 그대로 읽을 수 있고, `CLAUDE.md`가 금지한 "애플리케이션이 전체 payload를 읽어 클라이언트 UI로 숨기는 방식"과 동일해진다.**

### 2. `supabase/tests/access.sql` 생성

pgTAP으로 아래를 검증한다. `supabase/tests/` 디렉토리는 아직 없으므로 새로 만든다.

- authenticated role이 `transactions`와 `analysis_results`를 직접 `SELECT`하면 거부된다.
- 다른 사용자의 `upload_id`로 `get_upload_report()`를 호출하면 `null`이다.
- Free 사용자는 `scope = 'recent12m'`을 받고, 반환 JSON에 `full` 키가 없으며, `savings.items` 길이가 1 이하, `anomalies.items` 길이가 3 이하, `locked`가 true다.
- 같은 사용자를 Pro(`plan='pro'`, `current_period_end` 미래)로 바꾸면 **재분석 없이 같은 upload_id에서** `scope = 'full'`과 `locked = false`를 받는다.
- `current_period_end`가 과거인 `plan='pro'`는 Free로 취급된다.
- `transition_upload`가 `expected_status` 불일치 시 전이하지 않는다.
- `transition_upload`의 `metadata`에 `user_id`나 `retry_count`를 넣어도 반영되지 않는다.
- `claim_analysis_retry`를 4번 호출하면 4번째가 `retry_limit_exceeded`다.
- `reserve_upload`를 동시에 2번 호출하면 하나만 upload_id를 얻고 다른 하나는 `analysis_in_progress`다.
- `mark_stale_upload`가 10분 미만 active 행은 건드리지 않고, 10분 초과 행만 `failed`/`analysis_timeout`으로 바꾼다.

## Acceptance Criteria

```bash
npx supabase db reset          # 0005 → 0006 → 0007 순서로 오류 없이 적용
npx supabase test db           # access.sql 전부 통과
npm run lint
npm run build
npm test                       # 기존 121개 테스트가 그대로 통과
```

`npx supabase`가 로컬 Docker를 요구한다. Docker가 없거나 `supabase start`가 실패하면 **`blocked`로 기록하고 즉시 중단하라.** SQL을 검증 없이 `completed`로 넘기지 마라 — 검증되지 않은 마이그레이션이 이 결함을 만든 원인이다.

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 체크리스트:
   - 앱이 호출하는 RPC 6개가 모두 DB에 정의되었는가? 아래로 대조하라.
     ```bash
     grep -rhoE '\.rpc\("[a-z_]+"' src --include='*.ts' --include='*.tsx' | sort -u
     grep -ohE "create (or replace )?function public\.[a-z_]+" supabase/migrations/*.sql | sort -u
     ```
   - 4개 함수 모두 `security definer` + `set search_path = ''` + `revoke ... from public`인가?
   - `transactions`·`analysis_results`에 authenticated `SELECT` grant를 추가하지 않았는가?
   - `csv_uploads.status` check가 정확히 `queued|parsing|analyzing|partial|completed|failed` 6개인가?
3. `phases/1-db-contract/index.json`의 step 0를 갱신한다.
   - 성공 → `"status": "completed"`, `"summary"`에 마이그레이션 파일명과 추가된 함수 이름을 남긴다.
   - Docker/Supabase CLI 부재 → `"status": "blocked"` + `"blocked_reason"`
   - 3회 시도 후 실패 → `"status": "error"` + `"error_message"`

## 금지사항

- `supabase/migrations/0005_supabase_schema.sql`과 `0006_billing.sql`을 수정하지 마라. 이유: append-only 마이그레이션이 전제이고, 0005를 고치면 그 위에 쌓인 0006과 이미 통과한 테스트가 어긋난다.
- `transactions`나 `analysis_results`에 authenticated role의 `SELECT` 권한이나 정책을 추가하지 마라. 이유: 리포트는 `get_upload_report()`로만 읽는다는 것이 `CLAUDE.md`의 CRITICAL 규칙이다.
- `get_upload_report()`가 두 scope를 모두 반환하고 애플리케이션이나 UI에서 고르게 만들지 마라. 이유: 응답 본문에 유료 데이터가 실려 나가면 게이팅이 무력화된다.
- TypeScript 코드(`src/**`)를 수정하지 마라. 이유: 앱 status 어휘 통일은 이 phase의 step 1이 담당한다. 이 step은 DB 레이어만 다룬다.
- 카테고리(`식비`·`교통` 등 8종)나 `kind`(`debit`/`credit`) 어휘를 바꾸지 마라. 이유: 앱 타입과 DB가 현재 서로 일치하며, 변경하면 이미 통과한 phase 0-mvp의 step 2~13 코드와 테스트가 광범위하게 깨진다.
- 기존 테스트를 깨뜨리지 마라.
