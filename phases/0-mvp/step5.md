# Step 5: supabase-schema

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md` — DB 스키마 4테이블, RLS·인덱스, service role 사용 규칙
- `/CLAUDE.md` — service role과 시크릿 관련 CRITICAL 규칙
- `/src/types/` — step 2의 도메인 타입 (스키마와 1:1로 맞춰야 한다)
- `/.env` — Supabase 관련 환경변수 키

## 작업

Supabase 스키마와 클라이언트 계층을 만든다.

1. **마이그레이션 SQL** — `supabase/migrations/` 아래에 두고, Supabase SQL 에디터에서도 그대로 실행 가능한 순수 SQL로 작성한다. `docs/ARCHITECTURE.md`의 4테이블을 정의한다:
   `subscriptions`, `csv_uploads`, `transactions`, `analysis_results`
   - **금액은 반드시 `numeric(14,2)`.** float/double 금지.
   - 상태값은 CHECK 제약 또는 enum으로 5개(`uploading|parsing|analyzing|completed|failed`)만 허용한다.
   - `analysis_results.upload_id`는 unique — 업로드당 결과 1행이다.
2. **RLS** — 전 테이블에 RLS를 켜고 `auth.uid() = user_id` 정책을 적용한다. 정책 없이 노출되는 테이블이 없어야 한다.
3. **인덱스** — `transactions(upload_id)`, `csv_uploads(user_id, uploaded_at desc)`.
4. **원자적 월 한도 검사** — 한도 검사와 업로드 레코드 생성을 **하나의 트랜잭션**에서 수행하는 Postgres 함수를 만든다. 동시에 여러 요청이 들어와도 Free 월 5회를 초과해 생성되지 않아야 한다. 실패 시 호출자가 `upload_limit_reached`로 변환할 수 있는 형태로 신호를 준다. 카운트 대상은 `status <> 'failed'`인 당월 업로드다.
5. **Supabase 클라이언트 분리** (`src/services/`)
   - 브라우저용(anon/publishable key), 서버 사용자 컨텍스트용(쿠키 기반, RLS 적용), service role용 세 가지를 명확히 분리해 export한다.
   - **service role 클라이언트를 만드는 함수에는 "webhook 처리와 계정 삭제에서만 사용" 주석을 남기고, 클라이언트 번들에 포함될 수 없는 위치에 두어라.**
6. 신규 가입자에게 `subscriptions` 행이 `plan='free'`로 생기게 한다(트리거 또는 최초 조회 시 생성). 어느 쪽이든 한 곳에서만 처리되게 하라.

## Acceptance Criteria

```bash
npm run build
npm test
```

테스트는 타입과 스키마의 일치, 그리고 클라이언트 팩토리가 올바른 키를 참조하는지를 검증한다(실제 네트워크 호출 없이).

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 모든 테이블에 RLS와 정책이 있는가?
   - 금액이 `numeric(14,2)`인가?
   - service role 키가 클라이언트에서 참조될 수 없는 위치에 있는가?
   - 상태값이 5개로 제한되는가?
3. Supabase 프로젝트 URL·키가 `.env`에 없어 검증이 불가능하면 `"status": "blocked"`와 함께 필요한 키를 `blocked_reason`에 명시하라.
4. `phases/0-mvp/index.json`의 step 5를 업데이트한다. `"summary"`에 마이그레이션 파일 경로와 클라이언트 export 이름을 남겨라.

## 금지사항

- ORM(Prisma, Drizzle 등)을 도입하지 마라. 이유: Supabase 클라이언트만으로 충분하고, 스키마 정의가 두 곳으로 갈라진다.
- `profiles` 같은 사용자 테이블을 추가로 만들지 마라. 이유: `auth.users`에 이미 이메일이 있고 앱 고유로 저장할 데이터가 없다.
- `webhook_events`, `merchant_categories`, rate limit 테이블을 만들지 마라. 이유: 각각 `subscriptions` 컬럼, 매 요청 분류, 월 한도로 대체하기로 결정했다.
- RLS를 끄거나 우회하는 정책(`using (true)`)을 쓰지 마라. 이유: 타 사용자 데이터가 노출된다.
