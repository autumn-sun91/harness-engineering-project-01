# TxAnalyzer MVP — 구현 플랜

> **Harness 실행 규칙**: `phases/0-mvp/step0.md`~`step14.md`는 각각 독립 세션에서 실행된다. 모든 step은 아래 Global Constraints와 공통 인터페이스를 그대로 사용하고, TDD 순서와 step별 AC를 자체 문서에 반복 기재한다.

**Goal:** 거래내역/카드 명세서 CSV를 업로드하면 정확한 소비 인사이트를 제공하고, 로그인·결제·배포까지 동작하는 B2C 핀테크 SaaS MVP를 만든다.

**Architecture:** CSV의 금액 의미를 코드로 정규화하고 모든 산술을 결정론적으로 수행한다. 분석 결과는 `recent12m`과 `full` 두 scope로 생성·저장하되, DB 함수가 구독 상태를 확인해 허용된 scope와 티저만 반환하므로 클라이언트가 전체 payload에 직접 접근할 수 없다. 업로드 API는 durable row 생성 후 `202 + uploadId`를 반환하고 Next.js `after()`에서 제한시간이 있는 분석 작업을 수행한다.

**Tech Stack:** Next.js `15.5.24`, TypeScript strict, Tailwind CSS, Vitest, Playwright, Supabase Auth/Postgres, Polar, Claude API (`claude-sonnet-5`), Vercel Fluid Compute

**Spec:** `docs/PRD.md`, `docs/USER_JOURNEY.md`, `docs/ARCHITECTURE.md`, `docs/ADR.md`, `CLAUDE.md`

## Global Constraints

- Vercel Node.js Function 요청/응답 body는 4.5MB 제한이므로 파일은 정확히 `4_000_000` bytes 이하만 받는다.
- 행은 50,000개, 컬럼은 50개, 고유 정규화 가맹점은 LLM 분류 기준 2,000개로 제한한다.
- 금액은 JavaScript `number`로 산술하지 않고 decimal string → `numeric(14,2)`로 처리한다.
- 원본 CSV는 메모리에서만 처리하며 Supabase Storage나 DB에 영구 보관하지 않는다.
- Claude API 모델은 `claude-sonnet-5`, thinking은 disabled, 출력은 Structured Outputs와 Zod 양쪽으로 검증한다.
- Free는 월 5회, Pro는 월 30회이며 한 사용자는 동시에 분석 1건만 실행할 수 있다.
- 월 한도는 Asia/Seoul 달력 월 기준이다. 기본 파일/인코딩/행·컬럼 검증을 통과해 분석 row가 생성된 업로드는 이후 실패해도 1회로 계산한다.
- 재시도는 동일 upload row와 파싱된 transactions를 사용하고 최대 3회다. 새 업로드 한도를 다시 차감하지 않는다.
- API 응답의 LLM 텍스트는 Markdown/HTML로 해석하지 않고 plain text로만 렌더한다.
- 구현 step은 외부 자격증명 없이 mock으로 완료할 수 있어야 한다. 자격증명 부재가 `blocked` 사유가 되는 것은 step 1(Vercel preview 배포)과 step 14(live integration·production 배포)뿐이다.

---

## 1. Free / Pro 플랜과 데이터 경계

"본 적 없는 기능은 구매하지 않는다" — Pro 기능을 완전히 숨기지 않고 제한된 티저를 보여준다.

| 기능 | Free | Pro ($9/월) |
|---|---|---|
| CSV 업로드 | 월 5회 | 월 30회 |
| 동시 분석 | 1건 | 1건 |
| 조회 범위 | `recent12m` | `full` |
| 카테고리별 지출 / 기간별 추이 / AI 요약 | 전체 | 전체 |
| 구독 누수·이상 거래 | 건수 + 상세 최대 3건 | 전체 |
| 절약 인사이트 | 최대 3개 중 1개 | 전체 |

### Scope 정의

- `full`: 업로드에서 유효하게 정규화된 모든 거래.
- `recent12m`: 업로드 내 가장 최신 `occurred_on`이 속한 달과 직전 11개 달. 예를 들어 최신 거래가 2026-09-07이면 2025-10-01~2026-09-30이다.
- 두 scope는 업로드 시 고정되므로 시간이 지나도 같은 리포트의 수치가 바뀌지 않는다.
- `analysis_results.payload`에는 두 scope를 모두 저장한다. 각 scope는 자체 집계와 그 집계만 보고 생성된 자체 해석을 가진다.
- Free 응답은 `recent12m`만 선택하며, 티저 제한을 적용한 후 JSON을 생성한다. `full` key와 숨긴 배열 원소는 응답에 존재해서는 안 된다.
- Pro 응답은 `full`만 선택한다. 업그레이드 직후 재분석 없이 동일 저장 payload의 `full` scope가 열린다.
- `transactions`와 `analysis_results`에는 authenticated role의 직접 `SELECT` 권한을 부여하지 않는다. `get_upload_report(upload_id)` security-definer RPC가 `auth.uid()`와 현재 plan을 확인하고 서버에서 잘린 JSON만 반환한다.
- `GET /api/uploads/[id]`는 RPC 결과만 반환한다. 애플리케이션 코드에서 전체 payload를 읽어 클라이언트에서 숨기는 방식은 금지한다.

Free 누수 방지 AC:

1. 24개월 fixture에서 Free 카테고리 합계·추이·요약은 마지막 12개월만 반영한다.
2. 응답 JSON 직렬화 결과에 `full`, 12개월 밖 날짜/금액, 네 번째 상세, 두 번째 절약 인사이트가 없다.
3. authenticated JWT로 PostgREST의 `transactions`·`analysis_results` 직접 조회가 거부된다.
4. 같은 계정을 Pro로 바꾼 뒤 같은 uploadId를 조회하면 재분석 없이 `full` 결과가 반환된다.

---

## 2. 거래 정규화 계약

### CanonicalTransaction

```ts
type Category =
  | "housing" | "food" | "transport" | "shopping"
  | "health" | "education" | "leisure" | "subscription"
  | "utilities" | "finance" | "travel" | "other";
type TransactionKind = "purchase" | "refund" | "income" | "transfer" | "unknown";
type CurrencyCode = string; // Zod에서 /^[A-Z]{3}$/ 검증
type StatementType = "credit_card" | "bank_account";

type AmountMapping =
  | {
      mode: "signed_single";
      amountColumn: string;
      debitSign: "positive" | "negative";
    }
  | {
      mode: "debit_credit_split";
      debitColumn: string;
      creditColumn: string;
    };

interface ColumnMapping {
  statementType: StatementType;
  dateColumn: string;
  descriptionColumn: string;
  typeColumn: string | null;
  kindValueMap: Record<string, TransactionKind>;
  currencyColumn: string | null;
  defaultCurrency: "KRW";
  amount: AmountMapping;
}

interface CanonicalTransaction {
  occurredOn: string;          // YYYY-MM-DD
  description: string;
  merchantNormalized: string;
  amount: string;              // decimal string; purchase는 양수, refund는 음수
  kind: TransactionKind;
  currency: CurrencyCode;
  category: Category;
}
```

### 정규화 규칙

- `purchase`: 양수 지출로 집계한다.
- `refund`: 음수로 해당 scope와 카테고리의 지출에서 차감한다.
- `income`, `transfer`, `unknown`: DB에는 보존하지만 소비 합계·구독·이상 거래 탐지에서 제외한다.
- 정규화 직후 category는 `other`로 초기화하고 가맹점 batch 분류 결과로 갱신한 뒤에만 scope 집계를 만든다.
- 단일 amount 컬럼과 debit/credit 분리 컬럼을 모두 지원한다. `ColumnMapping.amount.mode`은 `signed_single | debit_credit_split`이고, 단일 컬럼이면 `debitSign`을 반드시 포함한다.
- credit-card statement는 방향과 type 값으로 purchase/refund를 정규화한다. bank-account statement는 `typeColumn`과 `kindValueMap`이 purchase/refund/income/transfer를 구분하지 못하면 `unsupported_transaction_semantics`로 실패한다.
- 통화 컬럼이 없으면 KRW로 간주한다. 하나의 업로드에서 둘 이상의 통화가 검출되면 `mixed_currency`로 실패하며 환율 변환은 MVP에서 하지 않는다.
- 날짜와 금액의 95% 이상이 파싱되고, 소비로 분류된 행의 부호 의미가 일관될 때만 mapping을 채택한다. 기준 미달은 `column_mapping_failed`다.
- 유효 행이 1개도 없거나 `purchase|refund` 행이 1개도 없으면 `unsupported_transaction_semantics`다.
- 부분 행 실패는 해당 행을 제외하고 `skippedRowCount`에 기록한다. 5%를 초과하면 전체 업로드를 실패시킨다.
- 가맹점 분류 전 정규화 이름을 dedupe한다. 빈도 내림차순, 이름 오름차순으로 최대 2,000개만 LLM에 보내고 나머지는 `other`로 분류한다.

필수 parser fixtures:

- 지출이 양수인 단일 amount CSV
- 지출이 음수인 단일 amount CSV
- debit/credit 분리 CSV
- 괄호 음수, 천 단위 쉼표, 소수점 쉼표가 있는 로케일 CSV
- 구매·환불·수입·이체가 섞인 CSV
- KRW/USD가 섞여 실패하는 CSV
- EUC-KR, UTF-8 BOM, 빈 파일, 50,001행, 51컬럼

---

## 3. 분석 파이프라인과 요청 생명주기

```text
POST /api/analyze
  → 세션·파일 크기·형식·인코딩·행/컬럼 기본 검증
  → reserve_upload() RPC: 월 한도 + 동시 1건 검사, upload row 생성
  → 갱신된 access token을 캡처
  → after(processUpload({ uploadId, userId, accessToken, fileBytes })) 등록
  → 202 { uploadId }

processUpload
  → status=parsing
  → 컬럼 매핑 추론 + 코드의 의미 검증
  → 정규화 transactions 저장
  → status=analyzing
  → 가맹점 분류 batch
  → 분류 category를 transactions에 저장
  → recent12m/full 결정론적 집계
  → 두 scope 해석을 Structured Output 1회 호출
  → payload 저장
  → completed 또는 partial
```

- UI는 active status일 때 `GET /api/uploads/[id]`를 2초, 4초, 이후 5초 간격으로 폴링한다. 2분 뒤 폴링을 중단하고 “분석은 계속됩니다. 나중에 다시 확인하세요”를 표시한다.
- `after()` callback은 브라우저 탭/응답 생명주기와 분리해 등록하고 `maxDuration = 300`인 Node.js runtime에서 실행한다.
- 내부 deadline은 240초다. 초과하면 `analysis_timeout`으로 실패시키고 이미 저장된 transactions는 retry에서 재사용한다.
- `queued|parsing|analyzing`이 10분 넘으면 조회 시 `mark_stale_upload()` RPC로 `failed/analysis_timeout` 전환한다.
- 컬럼 매핑/파싱 전 실패는 원본을 보관하지 않으므로 재시도할 수 없고 재업로드를 안내한다. transactions 저장 이후의 분류·해석 실패만 retry 대상이다.
- 해석만 실패하면 결정론적 집계를 payload에 저장하고 `partial` 상태로 둔다. UI는 집계 카드를 렌더하고 해석 카드에 재시도 버튼을 표시한다.
- 프로세스가 종료돼도 raw CSV는 Storage나 DB에 남지 않는다. 로그와 오류에도 파일 내용, 거래 적요, 키를 남기지 않는다.

### LLM 실행 한계

- 모델: `claude-sonnet-5`, `thinking: { type: "disabled" }`, 임의 sampling parameter 미설정.
- 컬럼 매핑: header + 최대 20개 대표 행만 입력한다.
- 분류: 최대 200개 가맹점/batch, 동시 batch 2개, 호출당 20초 timeout.
- 429와 5xx는 `Retry-After`를 우선해 jitter backoff로 최대 2회 재시도한다. 실패 batch는 `other`로 처리하고 전체 코드 집계를 버리지 않는다.
- 해석: `recent12m`과 `full`의 집계 통계만 한 호출에 넣고 각 scope별 결과를 받는다. 원본 거래 행은 전달하지 않는다.
- 모든 호출의 input/output token usage를 `analysis_results.payload.usage`에 기록하고 Anthropic Console 월 지출 한도를 배포 체크리스트에서 확인한다.

---

## 4. DB 스키마와 접근 계약

### 테이블 4개

- `subscriptions` — `user_id` unique FK, `plan free|pro`, Polar 상태/ID, cancel/current period, `last_event_id`, `last_event_ts`, `updated_at`.
- `csv_uploads` — id, user_id, original_filename, file_size, row_count, skipped_row_count, status(`queued|parsing|analyzing|partial|completed|failed`), error_code, scope_start, scope_end, currency, retry_count, uploaded_at, started_at, completed_at. 원본 경로나 암호화 metadata는 두지 않는다.
- `transactions` — id, upload_id, user_id, occurred_on, description, merchant_normalized, amount `numeric(14,2)`, kind, currency `char(3)`, category, created_at.
- `analysis_results` — upload_id unique, user_id, payload jsonb(`schemaVersion`, `scopes.recent12m`, `scopes.full`, `usage`), generated_at.

### 권한과 RPC

- 전 테이블 RLS를 활성화한다.
- authenticated role은 자신의 `subscriptions`와 `csv_uploads` metadata만 직접 SELECT할 수 있다. `subscriptions`와 `csv_uploads`의 직접 INSERT/UPDATE/DELETE는 허용하지 않는다.
- `transactions`와 `analysis_results`는 background callback이 캡처한 최신 user access token으로만 INSERT/UPDATE하며 `WITH CHECK (auth.uid() = user_id)`를 적용한다. 사용자가 자기 결과를 변조할 수 있다는 잔여 위험은 MVP에서 수용하되 다른 사용자 데이터·유료 scope 접근으로 이어져서는 안 된다.
- authenticated role의 `transactions`, `analysis_results` SELECT grant/policy는 만들지 않는다.
- security-definer 함수는 `SET search_path = ''`, 입력 UUID 소유권 검사, PUBLIC EXECUTE revoke를 공통 적용한다.
- Auth 사용자 생성 trigger는 `subscriptions(plan='free')` row를 만든다. `reserve_upload`도 row 부재를 Free로 간주해 기존 사용자 migration 중 동작해야 한다.
- effective plan은 `plan='pro'`이고 `current_period_end >= now()`일 때만 Pro다. `cancel_at_period_end=true`여도 기간 종료 전에는 Pro이며, 그 외 상태는 Free로 처리한다.
- `reserve_upload(file_name text, file_size int)` → `{upload_id uuid}`: KST 월 한도와 active 1건을 잠금 안에서 검사하고 row를 원자 생성한다.
- `transition_upload(upload_id uuid, expected_status text, next_status text, metadata jsonb)` → void: 소유권과 현재 status를 잠그고 `queued→parsing→analyzing→completed|partial|failed` 전이 및 허용 metadata 필드만 갱신한다.
- `claim_analysis_retry(upload_id uuid)` → `{retry_count int}`: 소유자·retry 가능 상태·3회 상한을 원자 검사한다.
- `mark_stale_upload(upload_id uuid)` → void: 소유자 조회 경로에서 10분 초과 active row만 실패 전환한다.
- `get_upload_report(upload_id uuid)` → jsonb: 소유권과 현재 plan을 확인한 뒤 허용 scope만 선택하고 Free teaser를 잘라 반환한다.
- 모든 RPC에는 동시 호출 테스트를 작성한다. `reserve_upload` 2개 동시 호출 중 하나만 active row를 얻어야 한다.
- 인덱스: `transactions(upload_id)`, `transactions(upload_id, occurred_on)`, `csv_uploads(user_id, uploaded_at desc)`, active upload를 위한 partial index.

---

## 5. API 계약

- `POST /api/analyze` — multipart file ≤4,000,000 bytes → `202 { uploadId }`.
- `POST /api/analyze/[id]/retry` — 저장된 transactions로 분류/해석만 재실행 → `202 { uploadId }`.
- `GET /api/uploads` — 소유자의 metadata/history만 반환.
- `GET /api/uploads/[id]` — status와 `get_upload_report()` 결과 반환. active/failed 상태에서는 report가 null일 수 있다.
- `POST /api/polar/checkout` — product ID는 서버 상수, user ID는 세션에서 취득.
- `POST /api/polar/webhook` — raw body 서명 검증 후 처리, event ID 멱등성과 timestamp 순서 방어.
- `GET /api/polar/portal` — 현재 사용자의 Polar customer만 대상으로 portal URL 생성.
- `POST /api/account/delete` — Polar 구독 취소 → 앱 DB 삭제 → Auth 사용자 삭제. 단계별 idempotent 처리와 실패 시 재호출 가능.

에러 형식은 `{ error: { code, message } }`로 통일한다.

```ts
type ErrorCode =
  | "unauthorized"
  | "file_too_large"
  | "invalid_file_type"
  | "empty_file"
  | "encoding_error"
  | "parse_failed"
  | "column_mapping_failed"
  | "mixed_currency"
  | "unsupported_transaction_semantics"
  | "upload_limit_reached"
  | "analysis_in_progress"
  | "retry_limit_exceeded"
  | "analysis_timeout"
  | "analysis_failed"
  | "not_found";
```

클라이언트는 HTTP message 문자열이 아니라 `code`로만 분기한다.

---

## 6. 공통 TypeScript 인터페이스

아래 이름과 필드는 step 간 고정 계약이다.

```ts
type UploadStatus = "queued" | "parsing" | "analyzing" | "partial" | "completed" | "failed";

interface CsvProfile {
  encoding: "utf-8" | "euc-kr";
  headers: string[];
  rows: Array<Record<string, string>>;
  rowCount: number;
}

interface NormalizeResult {
  transactions: CanonicalTransaction[];
  skippedRowCount: number;
  currency: CurrencyCode;
}

interface Candidate {
  id: string;
  kind: "subscription" | "anomaly";
  merchant: string;
  amount: string;
  occurredOn: string;
  category: Category;
}

interface SavingInsight {
  id: string;
  title: string;
  description: string;
  estimatedMonthlySaving: string;
}

type ReportCandidate = Candidate & { explanation: string | null };

interface AggregateSet {
  categorySpend: Array<{ category: Category; amount: string }>;
  monthlyTrend: Array<{ month: string; amount: string }>;
  subscriptionCandidates: Candidate[];
  anomalyCandidates: Candidate[];
}

interface ScopeResult {
  aggregates: AggregateSet;
  interpretation: {
    summary: string;
    savings: SavingInsight[];
    candidateExplanations: Array<{ candidateId: string; explanation: string }>;
  } | null;
}

interface StoredAnalysisPayload {
  schemaVersion: 1;
  scopes: { recent12m: ScopeResult; full: ScopeResult };
  usage: { inputTokens: number; outputTokens: number; model: "claude-sonnet-5" };
}

interface ReportView {
  scope: "recent12m" | "full";
  categorySpend: AggregateSet["categorySpend"];
  monthlyTrend: AggregateSet["monthlyTrend"];
  summary: string | null;
  subscriptions: { totalCount: number; items: ReportCandidate[]; locked: boolean };
  anomalies: { totalCount: number; items: ReportCandidate[]; locked: boolean };
  savings: { totalCount: number; items: SavingInsight[]; locked: boolean };
}

interface ProcessUploadInput {
  uploadId: string;
  userId: string;
  accessToken: string; // 메모리 전용, 로그/DB 저장 금지
  fileBytes: Uint8Array;
}

declare function profileCsv(bytes: Uint8Array): CsvProfile;
declare function normalizeTransactions(
  profile: CsvProfile,
  mapping: ColumnMapping,
): NormalizeResult;
declare function buildScopes(
  transactions: CanonicalTransaction[],
): { recent12m: AggregateSet; full: AggregateSet };
declare function inferColumnMapping(profile: CsvProfile): Promise<ColumnMapping>;
declare function classifyMerchants(
  merchants: string[],
): Promise<Map<string, Category>>;
declare function interpretScopes(input: {
  recent12m: AggregateSet;
  full: AggregateSet;
}): Promise<{
  recent12m: ScopeResult["interpretation"];
  full: ScopeResult["interpretation"];
  usage: StoredAnalysisPayload["usage"];
}>;
```

Free `ReportView`는 subscription/anomaly items 각각 최대 3개, savings items 최대 1개이며 `locked=true`다. Pro는 모든 items와 `locked=false`다.

---

## 7. 보안 요구사항

| ID | 항목 | 검증 |
|---|---|---|
| S1 | Polar webhook raw body 서명 검증 | 서명 없음/변조 요청 거부, DB 불변 |
| S2 | checkout product ID 서버 상수, user ID 세션 취득 | 조작된 body가 상품·사용자를 변경하지 못함 |
| S3 | service role은 webhook·계정삭제로 한정 | 일반 조회/분석 경로 import 금지 테스트 |
| S4 | 로그인 redirect는 `/`로 시작하고 `//`가 아닌 상대 경로만 허용 | 외부 URL과 protocol-relative URL 차단 |
| S5 | 프롬프트 데이터 영역 격리 + Structured Outputs + Zod | 적요의 지시문이 스키마/산술을 변경하지 못함 |
| S6 | LLM 텍스트 plain text 렌더 | Markdown 링크와 HTML이 DOM으로 해석되지 않음 |
| S7 | 원본 CSV 비보관 | 성공/실패 후 Storage와 DB에 원본·경로 없음 |
| S8 | 월 한도 + 동시 1건 + retry 3회 원자 검사 | 병렬 요청으로 우회 불가 |
| S9 | 로그에 거래 내용·파일 내용·키 금지 | logger unit test와 수동 로그 확인 |
| S10 | 4MB/50,000행/50컬럼/2,000 unique merchant 상한 | 각 경계값 테스트 |
| S11 | full payload 직접 SELECT 금지 | authenticated PostgREST 직접 접근 거부 |

LLM에는 컬럼 매핑용 header/대표 행과 분류용 정규화 가맹점명, 해석용 집계 통계만 전송한다. 이 전송 범위와 Anthropic 이용 사실을 `/privacy`와 업로드 동의 문구에 명시한다.

MVP 제외: 원본 재다운로드·재분석, PDF 내보내기, 수동 컬럼 매핑 UI, 다중 통화 환산, CSP 커스텀 정책, 조직 계정, 별도 작업 큐.

---

## 8. 사용자 여정과 엣지 케이스

**Happy path:** 랜딩 → Google OAuth → 대시보드 empty state → CSV 업로드 → 즉시 uploadId 수신 → 상태 폴링 → 결과 5카드 → Free 티저 → Polar checkout → 복귀 시 Polar 직접 1회 조회 → 같은 리포트의 full scope 잠금 해제.

| 상황 | 처리 |
|---|---|
| 비CSV/4MB 초과/빈 파일/행·컬럼 초과 | 분석 row 생성 전 거부, 한도 미차감 |
| 컬럼 의미 불명확/혼합 통화/소비 행 없음 | failed + 재업로드 안내, 생성된 row는 한도 차감 |
| 일부 행 파싱 실패 ≤5% | 행 제외 + skippedRowCount 표시 |
| 일부 행 파싱 실패 >5% | parse_failed |
| LLM 분류 batch 일부 실패 | 해당 가맹점 other + 나머지 분석 계속 |
| LLM 해석 실패 | partial + 코드 집계 렌더 + retry 버튼 |
| 탭 종료 | after 작업 지속; 재방문 시 uploads metadata에서 active/completed 복구 |
| 10분 이상 active | 조회 시 analysis_timeout으로 전환 |
| Free 월 6번째/Pro 월 31번째 | upload_limit_reached |
| 이미 active 분석 존재 | analysis_in_progress |
| retry 4번째 | retry_limit_exceeded |
| 타 사용자 uploadId/full payload 직접 접근 | RPC 소유권 검사 또는 DB 권한으로 거부 |
| 결제 webhook 지연·유실 | checkout 복귀 시 Polar 직접 조회, webhook은 백업 |
| 다운그레이드 | 같은 payload를 보존하고 이후 응답을 recent12m/teaser로 재잠금 |
| 계정 삭제 재호출 | 완료된 단계는 no-op, 남은 Polar/DB/Auth 단계 계속 |

---

## 9. 산출물 1 — 설계 문서

- `docs/USER_JOURNEY.md` 신규: 전체 여정 flowchart, upload stateDiagram, billing sequenceDiagram.
- `docs/ARCHITECTURE.md`: dual-scope payload, security-definer report RPC, `after()` 처리, 원본 비보관, 4테이블/API 계약.
- `docs/PRD.md`: Free 5/Pro 30, recent12m 정의, 티저, 원본 비보관, 법적 고지. 디자인 섹션은 `DESIGN.md`를 가리킨다.
- `docs/DESIGN.md` 신규: finsight-design 스킬 기반 시각 언어. 토큰(색·타입·간격), 화면별 표면, 컴포넌트 3분류, 금액 표기, 잠금 표현, 차트, 상태·에러 문구, 한국어 카피 규칙. 라이트 캔버스 + 포인트 컬러 `#0052ff` 하나.
- `docs/ADR.md`:
  - ADR-002 Supabase Storage 제외 (원본 비보관에 따라 파일 스토리지가 불필요).
  - ADR-007 `202 + after() + polling`.
  - ADR-008 업로드별 독립 리포트.
  - ADR-009 집계는 코드·LLM은 해석.
  - ADR-010 dual-scope 생성 + DB RPC 트리밍.
  - ADR-011 원본 CSV 비보관.
  - ADR-012 LLM 컬럼 매핑 + 코드 의미 검증.
- `CLAUDE.md`: service role 범위, numeric 산술, 신뢰 불가 입력, raw CSV 비보관, full payload 직접 SELECT 금지.

문서 작성 후 `rg '원본.*보관|Storage.*CSV|무제한|최근 12개월' docs CLAUDE.md`로 상충 문구를 찾아 모두 새 계약으로 통일한다.

---

## 10. 산출물 2 — Harness step 파일 15개

각 step 파일은 아래 Files/Interfaces/Tests를 그대로 포함하고, 테스트 실패 → 최소 구현 → 전체 회귀 테스트 → 커밋 순서의 체크박스로 작성한다.

| # | name | Files | Produces / Tests |
|---|---|---|---|
| 0 | `project-setup` | `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `vitest.config.ts`, `.env.example`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/test/setup.ts`, `src/app/__tests__/smoke.test.tsx` | Next 15.5.24 고정; `dev/build/lint/test` scripts; smoke test |
| 1 | `deploy-preview` | `.gitignore`(`.vercel`) | 목업 상태 Vercel **preview** 배포, URL 200 검증. **Polar production 심사 제출 요청**(ADR-013·ADR-015). Vercel 인증 없으면 `blocked` |
| 2 | `core-types` | `src/types/domain.ts`, `src/types/api.ts`, `src/types/schemas.ts`, `src/lib/env.ts`, `src/types/__tests__/contracts.test.ts`, `src/lib/__tests__/env.test.ts` | 이 문서 §2·§5·§6 타입과 Zod schemas; server/client env 분리 |
| 3 | `csv-parser` | `src/lib/csv/detect-encoding.ts`, `src/lib/csv/profile-csv.ts`, `src/lib/csv/normalize-transactions.ts`, `src/lib/csv/__tests__/fixtures/*.csv`, `src/lib/csv/__tests__/normalize-transactions.test.ts` | `profileCsv`, `normalizeTransactions`; §2 fixture 전부 |
| 4 | `analysis-core` | `src/lib/analysis/aggregate.ts`, `src/lib/analysis/recurring.ts`, `src/lib/analysis/anomaly.ts`, `src/lib/analysis/__tests__/aggregate.test.ts` | `buildScopes`; decimal 산술·refund·제외 kind·scope 경계 |
| 5 | `supabase-schema` | `supabase/migrations/001_schema.sql`, `supabase/migrations/002_rls_and_functions.sql`, `supabase/tests/access.sql`, `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts` | 4테이블, RPC 5개, 신규 사용자 Free trigger, direct SELECT 거부, 상태 전이·동시 reserve/retry |
| 6 | `auth-flow` | `src/app/login/page.tsx`, `src/app/login/actions.ts`, `src/app/auth/callback/route.ts`, `src/middleware.ts`, `src/lib/auth/redirect.ts`, `src/lib/auth/__tests__/redirect.test.ts` | Google OAuth, 세션 갱신, 안전한 상대 redirect |
| 7 | `llm-analysis` | `src/services/anthropic.ts`, `src/lib/llm/schemas.ts`, `src/lib/llm/column-mapper.ts`, `src/lib/llm/merchant-classifier.ts`, `src/lib/llm/interpreter.ts`, `src/lib/llm/__tests__/llm-analysis.test.ts` | `inferColumnMapping`, `classifyMerchants`, `interpretScopes`; mock transport, Structured Outputs, timeout/429/5xx |
| 8 | `analysis-orchestrator` | `src/lib/analysis/process-upload.ts`, `src/lib/analysis/analysis-repository.ts`, `src/lib/analysis/__tests__/process-upload.test.ts` | `processUpload(input: ProcessUploadInput,deps): Promise<void>`; user-token RLS 쓰기, 상태 전이, 240초 deadline, partial/failure, raw 비보관 |
| 9 | `analyze-api` | `src/app/api/analyze/route.ts`, `src/app/api/analyze/[id]/retry/route.ts`, `src/app/api/uploads/route.ts`, `src/app/api/uploads/[id]/route.ts`, `src/app/api/__tests__/analyze.test.ts` | 202 후 `after()`, RPC-only report, polling, 소유권·한도 |
| 10 | `dashboard-ui` | `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/dashboard/error.tsx`, `src/components/upload/upload-widget.tsx`, `src/components/upload/use-upload-polling.ts`, `src/components/report/report-cards.tsx`, `src/components/report/history-list.tsx`, `src/components/report/__tests__/report-cards.test.tsx` | empty/upload/poll/partial/error/5 cards/teaser/history; plain text |
| 11 | `billing` | `src/services/polar.ts`, `src/lib/billing/subscription-sync.ts`, `src/app/api/polar/checkout/route.ts`, `src/app/api/polar/webhook/route.ts`, `src/app/api/polar/portal/route.ts`, `src/lib/billing/__tests__/subscription-sync.test.ts` | 서명, 서버 product, event order/idempotency, checkout return refresh |
| 12 | `account-settings` | `src/app/(dashboard)/settings/page.tsx`, `src/app/api/account/delete/route.ts`, `src/lib/account/delete-account.ts`, `src/lib/account/__tests__/delete-account.test.ts` | idempotent Polar→DB→Auth 삭제; 단계별 실패와 재호출 |
| 13 | `landing-and-legal` | `src/app/(marketing)/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/(marketing)/__tests__/landing.test.tsx` | $9·5/30 비교, LLM 전송/원본 비보관 고지, 접근성 smoke |
| 14 | `deploy-production` | `vercel.json`, `playwright.config.ts`, `e2e/mvp.spec.ts`, `docs/DEPLOYMENT.md` | production 승격, Node/300초/env 검증, live integrations, E2E |

모든 step의 공통 AC:

```bash
npm run lint
npm run build
npm test
```

Step 5는 추가로 `npx supabase db reset && npx supabase test db`, Step 14는 Playwright E2E와 배포 smoke test를 실행한다.

---

## 11. 실행 전제와 Harness 안전장치

- `python3 scripts/execute.py 0-mvp` 전에 `git status --short`가 비어 있어야 한다. 계획/설계 문서는 먼저 별도 커밋한다. 실행기가 `git add -A`를 사용하므로 dirty tree에서는 실행하지 않는다.
- step 0과 step 2~13은 API 응답 fixture와 mock transport를 사용한다. 키가 없다는 이유로 status를 `blocked`로 바꾸지 않는다.
- step 1은 Vercel 인증(`npx vercel whoami` 또는 `VERCEL_TOKEN`)이 없으면 `blocked`다. ADR-015에 따라 이 step 직후 Polar production 심사를 제출해야 한다.
- step 14 시작 전 필요한 값: Supabase URL/publishable/service-role key, Google OAuth Client ID/Secret, Anthropic API key, Polar API key/product ID/webhook secret, Vercel project.
- `ANTHROPIC_MODEL=claude-sonnet-5`, `POLAR_PRODUCT_ID`는 서버 전용 환경변수다.
- live 자격증명이 없으면 step 1과 step 14만 `blocked`로 기록하며, 앞선 구현 커밋은 보존한다.

---

## 12. 최종 검증

1. **문서 일관성** — Free 5/Pro 30, raw 비보관, dual-scope, service role 범위가 5개 문서에서 동일한지 확인한다.
2. **거래 정확성** — §2 fixtures의 category/month 합계를 decimal 기준 expected 값과 대조한다.
3. **Free 경계** — 24개월 fixture, direct PostgREST SELECT, 네 번째 teaser, 업그레이드/다운그레이드를 자동 테스트한다.
4. **비동기 복구** — POST 응답 직후 요청 페이지를 종료하고 다른 세션에서 uploadId/status/result를 복구한다. 240초 timeout과 10분 stale 전환도 fake clock으로 검증한다.
5. **비용 경계** — Free 6번째, Pro 31번째, 동시 두 업로드, 2,001번째 unique merchant, retry 4번째를 거부/other 처리한다.
6. **보안** — unsigned/변조 webhook, 타 사용자 uploadId, 외부 redirect와 `//evil.com`, prompt injection fixture, plain-text XSS fixture, 로그 PII 부재를 확인한다.
7. **부분 실패** — 분류 batch 429/5xx와 해석 실패를 강제해 코드 집계가 보존되고 UI가 partial을 렌더하는지 확인한다.
8. **계정 삭제** — Polar/DB/Auth 각 단계 실패를 한 번씩 주입하고 재호출로 완료되는지 확인한다.
9. **E2E** — 랜딩→Google 로그인→업로드→polling→Free 결과→Polar sandbox 결제→같은 uploadId full 잠금 해제→포털 해지→다운그레이드 재잠금.
10. **배포** — Vercel preview에서 Fluid Compute/Node runtime/300초, 4MB 경계, 환경변수, Anthropic 지출 한도를 확인한다.
