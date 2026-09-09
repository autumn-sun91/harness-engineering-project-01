# 아키텍처

## 디렉토리 구조
```
src/
├── app/
│   ├── (marketing)/       # 랜딩, /privacy, /terms
│   ├── (dashboard)/       # 대시보드, 설정
│   ├── login/             # Google OAuth 버튼
│   ├── auth/callback/     # code → session 교환
│   └── api/               # 라우트 핸들러 (아래 API 목록)
├── components/
│   ├── upload/            # 업로드 위젯, 폴링 훅
│   └── report/            # 결과 5카드, 히스토리
├── types/                 # 도메인 타입 + API 응답/에러 계약 + Zod schemas
├── lib/
│   ├── csv/               # 인코딩 감지, 프로파일링, 금액 정규화
│   ├── analysis/          # 코드 집계, 반복결제·이상 탐지, processUpload
│   ├── llm/               # 컬럼 매핑, 가맹점 분류, 해석
│   ├── billing/           # 구독 상태 동기화
│   ├── account/           # 계정 삭제
│   ├── auth/              # redirect 검증
│   └── supabase/          # browser / server / admin 클라이언트
├── services/              # 외부 API 래퍼 (anthropic, polar)
└── middleware.ts          # 세션 검증·갱신

supabase/migrations/       # 스키마, RLS, RPC
e2e/                       # Playwright
```

## 패턴
- Server Components 기본. 업로드 위젯 등 상태·이벤트가 필요한 곳만 Client Component.
- **읽기**: `subscriptions`와 `csv_uploads` metadata만 RLS가 걸린 사용자 컨텍스트 클라이언트로 직접 조회한다. **`transactions`와 `analysis_results`에는 authenticated role의 SELECT 권한을 주지 않고**, 리포트는 security-definer RPC `get_upload_report()`로만 읽는다.
- **쓰기**: 사용자 요청 경로의 쓰기는 RPC를 거친다(`reserve_upload`, `transition_upload`, `claim_analysis_retry`, `mark_stale_upload`). `subscriptions`와 `csv_uploads`의 직접 INSERT/UPDATE/DELETE는 허용하지 않는다.
- `transactions`와 `analysis_results` 쓰기는 백그라운드 작업이 캡처한 사용자 access token으로 수행하고 `WITH CHECK (auth.uid() = user_id)`를 적용한다.
- **외부 API 호출**(Claude, Polar)은 `app/api/` 라우트 핸들러와 `after()` 백그라운드 작업에서만 수행하고, 호출은 `services/` 래퍼를 거친다.
- **service role 클라이언트는 RLS를 우회**하므로 webhook 처리와 계정 삭제에만 쓰고, 해당 경로에서는 소유권을 명시적으로 검사한다.
- Pro 전용 데이터와 조회 범위 제한은 DB 함수가 응답 필드를 제외하는 방식으로 게이팅한다. 클라이언트에서 UI만 숨기지 않는다.

## 분석 파이프라인 — 집계는 코드, LLM은 해석

```
POST /api/analyze → 기본 검증 → reserve_upload() → 202 { uploadId }
                                                        ↓ after()
processUpload: parsing → 컬럼 매핑 → 정규화 저장 → analyzing
             → 가맹점 분류 → 집계(recent12m·full) → 해석 1회 → completed | partial
```

- **코드(결정론적)**: 카테고리별 합계, 기간별 추이, 반복 결제 후보 탐지(동일 가맹점 + 유사 금액 + 주기성). **금액 산술은 절대 LLM에 맡기지 않는다** — 환각이 발생하면 합계가 틀린다. 산술은 JavaScript `number`가 아니라 decimal string으로 처리한다.
- **LLM**: ① 헤더 + 최대 20개 대표 행으로 컬럼 매핑 추론 ② 가맹점명 → 카테고리 분류(batch당 200개, 동시 2개) ③ `recent12m`·`full` 집계 **통계만** 입력으로 받아 요약 + 절약 인사이트 + 후보 설명을 **1회 호출**로 생성. 출력은 Structured Outputs와 Zod 양쪽으로 검증한다.
- 업로드는 `202 + uploadId`로 즉시 반환하고, 분석은 `after()`에 등록해 `maxDuration = 300`인 Node.js runtime에서 실행한다. UI는 `GET /api/uploads/[id]`를 2초·4초·이후 5초 간격으로 폴링하고 2분 뒤 중단한다(SSE 불필요).
- 내부 deadline은 240초다. 초과하면 `analysis_timeout`으로 실패시키고, 저장된 transactions는 retry에서 재사용한다. `queued|parsing|analyzing`이 10분을 넘으면 조회 시 `mark_stale_upload()`로 실패 전환한다.
- 해석만 실패하면 집계를 저장하고 `partial`로 둔다. 컬럼 매핑·파싱 전 실패는 원본을 보관하지 않으므로 재시도할 수 없고 재업로드를 안내한다.

## 데이터 흐름
```
1. 로그인
   랜딩 → /login → Google OAuth → /auth/callback → 대시보드

2. CSV 분석
   업로드 → POST /api/analyze
   → 파일 크기·형식·인코딩·행/컬럼 기본 검증
   → reserve_upload() RPC: 월 한도 + 동시 1건 검사, upload row 원자 생성
   → 202 { uploadId } 반환 + after()에 분석 등록
   → 파싱 (컬럼 매핑 추론 포함) → 두 scope 코드 집계 → LLM 해석 → analysis_results 저장
   → UI 폴링 → get_upload_report()가 plan에 맞춰 트리밍한 JSON을 렌더

3. 결제
   업그레이드 → POST /api/polar/checkout → Polar 결제
   → 복귀(?checkout=success) 시 Polar 1회 조회로 즉시 반영
   → webhook은 백업 경로 (서명 검증 + last_event_ts 비교)
```

## DB 스키마 (4테이블)

- `subscriptions` — user_id(unique, FK `auth.users`), plan(`free|pro`), polar_status, polar_customer_id, polar_subscription_id, cancel_at_period_end, current_period_end, last_event_id, last_event_ts, updated_at
- `csv_uploads` — id, user_id, original_filename, file_size, row_count, skipped_row_count, status(`queued|parsing|analyzing|partial|completed|failed`), error_code, scope_start, scope_end, currency, retry_count, uploaded_at, started_at, completed_at. **원본 경로나 암호화 metadata는 두지 않는다.**
- `transactions` — id, upload_id, user_id, occurred_on, description, merchant_normalized, **amount numeric(14,2)**, kind, currency `char(3)`, category, created_at
- `analysis_results` — upload_id(unique), user_id, payload(jsonb: `schemaVersion`, `scopes.recent12m`, `scopes.full`, `usage`), generated_at

전 테이블 RLS를 활성화한다. authenticated role은 자신의 `subscriptions`와 `csv_uploads` metadata만 직접 SELECT할 수 있고, **`transactions`와 `analysis_results`에는 SELECT grant/policy를 만들지 않는다.**

인덱스는 `transactions(upload_id)`, `transactions(upload_id, occurred_on)`, `csv_uploads(user_id, uploaded_at desc)`, active upload용 partial index.

**금액은 반드시 `numeric(14,2)`를 쓴다. float은 반올림 오차가 생긴다.**

### RPC

security-definer 함수는 `SET search_path = ''`, 입력 UUID 소유권 검사, PUBLIC EXECUTE revoke를 공통 적용한다.

| 함수 | 역할 |
|---|---|
| `reserve_upload(file_name, file_size)` | KST 월 한도와 active 1건을 잠금 안에서 검사하고 row를 원자 생성 |
| `transition_upload(upload_id, expected_status, next_status, metadata)` | 소유권·현재 status를 잠그고 허용된 전이와 metadata만 갱신 |
| `claim_analysis_retry(upload_id)` | 소유자·retry 가능 상태·3회 상한을 원자 검사 |
| `mark_stale_upload(upload_id)` | 10분 초과 active row만 실패 전환 |
| `get_upload_report(upload_id)` | 소유권과 현재 plan을 확인해 허용 scope만 선택하고 Free teaser로 잘라 반환 |

**월 한도와 동시 1건 검사는 `reserve_upload` 안에서 원자적으로** 처리해 병렬 요청 우회를 막는다. 재시도는 같은 row를 재사용하므로 한도를 다시 차감하지 않는다.

Auth 사용자 생성 trigger가 `subscriptions(plan='free')` row를 만든다. effective plan은 `plan='pro'`이고 `current_period_end >= now()`일 때만 Pro다. `cancel_at_period_end=true`여도 기간 종료 전에는 Pro다.

## API

| 라우트 | 설명 |
|---|---|
| `POST /api/analyze` | multipart(≤4,000,000 bytes) → `202 { uploadId }` |
| `POST /api/analyze/[id]/retry` | 저장된 transactions로 분류·해석만 재실행 → `202 { uploadId }`, 3회 상한 |
| `GET /api/uploads` | 소유자의 metadata·히스토리 |
| `GET /api/uploads/[id]` | status + `get_upload_report()` 결과. active·failed에서는 report가 null일 수 있다 |
| `POST /api/polar/checkout` | 체크아웃 세션 생성 (product ID는 서버 상수) |
| `POST /api/polar/webhook` | 서명 검증 후 구독 상태 갱신 |
| `GET /api/polar/portal` | 고객 포털 리다이렉트 |
| `POST /api/account/delete` | 계정·데이터 삭제 |

에러는 `{ error: { code, message } }` 단일 형식이며 code는 다음 중 하나다: `unauthorized | file_too_large | invalid_file_type | empty_file | encoding_error | parse_failed | column_mapping_failed | mixed_currency | unsupported_transaction_semantics | upload_limit_reached | analysis_in_progress | retry_limit_exceeded | analysis_timeout | analysis_failed | not_found`. **UI는 message 문자열이 아니라 code로 분기한다.**

Free 트리밍 규칙: subscription과 anomaly는 각각 상위 3건 + `totalCount`, savings는 상위 1건 + `totalCount`, 응답에 `locked: true`를 동봉한다. `full` key와 잘라낸 배열 원소는 응답에 존재해서는 안 된다.

## 상태 관리
- 서버 상태: Server Components에서 metadata는 직접 조회, 리포트는 `get_upload_report()` RPC (별도 캐싱 레이어 없음)
- 클라이언트 상태: 업로드 위젯 진행 상태와 분석 폴링은 Client Component에서 로컬 관리
- 인증 세션: Supabase Auth 쿠키를 미들웨어에서 검증·갱신

## 보안 경계

- **원본 CSV는 보관하지 않는다.** 메모리에서만 처리하고 Supabase Storage와 DB 어디에도 남기지 않는다. 성공·실패 어느 경로에서도 원본과 그 경로가 남아서는 안 된다. 따라서 암호화 키도, 재다운로드도, 파싱 전 실패의 재시도도 없다.
- **파생 데이터(`transactions`)**는 Postgres at-rest 암호화 + RLS로 보호한다. 집계 쿼리가 가능해야 하므로 앱 레벨 암호화를 적용하지 않는다.
- **LLM에 보내는 것은 컬럼 매핑용 헤더·대표 행(최대 20개), 분류용 정규화 가맹점명, 해석용 집계 통계뿐이다. 거래 원본 전체는 보내지 않는다.**
- **CSV 입력과 LLM 출력은 모두 신뢰 불가 입력이다.** 프롬프트에서 데이터 영역을 격리하고, LLM 출력은 Structured Outputs와 Zod 검증 후 **플레인 텍스트로만 렌더**한다(마크다운·HTML 렌더 금지).
- 로그와 오류에 거래 내용·파일 내용·키·access token을 남기지 않는다.
- 상한: 4,000,000 bytes / 50,000행 / 50컬럼 / 고유 가맹점 2,000개.
- `transactions`와 `analysis_results`를 사용자 토큰으로 쓰기 때문에 **사용자가 자기 결과를 변조할 수 있다**는 잔여 위험이 있다. MVP에서 수용하되 타 사용자 데이터나 유료 scope 접근으로 이어져서는 안 된다.
- MVP에서 의도적으로 제외: CSP 커스텀 헤더, 분당 rate limit, 감사 로그, 별도 작업 큐.
