# 아키텍처

## 디렉토리 구조
```
src/
├── app/
│   ├── (marketing)/       # 랜딩, /privacy, /terms
│   ├── (dashboard)/       # 대시보드, 히스토리, 리포트 상세, 설정
│   ├── login/             # Google OAuth 버튼
│   ├── auth/callback/     # code → session 교환
│   └── api/               # 라우트 핸들러 (아래 API 목록)
├── components/            # UI 컴포넌트
├── types/                 # 도메인 타입 + API 응답/에러 계약
├── lib/
│   ├── csv/               # 인코딩 감지, 파싱, 금액 정규화
│   └── analysis/          # 코드 기반 집계, 반복결제 탐지
└── services/              # 외부 API 래퍼 (Claude, Polar, Supabase)
```

## 패턴
- Server Components 기본. 업로드 위젯 등 상태·이벤트가 필요한 곳만 Client Component.
- **읽기**는 Server Component에서 RLS가 걸린 사용자 컨텍스트 Supabase 클라이언트로 직접 조회한다.
- **쓰기와 외부 API 호출**(Claude, Polar)은 `app/api/` 라우트 핸들러에서만 수행하고, 호출은 `services/` 래퍼를 거친다.
- **service role 클라이언트는 RLS를 우회**하므로 webhook 처리와 계정 삭제에만 쓰고, 해당 경로에서는 소유권을 명시적으로 검사한다.
- Pro 전용 데이터와 조회 기간 제한은 반드시 서버에서 응답 필드를 제외하는 방식으로 게이팅한다. 클라이언트에서 UI만 숨기지 않는다.

## 분석 파이프라인 — 집계는 코드, LLM은 해석

```
CSV → 파싱 → [코드] 정규화·집계 → [LLM] 해석 → 저장
```

- **코드(결정론적)**: 카테고리별 합계, 기간별 추이, 반복 결제 후보 탐지(동일 가맹점 + 유사 금액 + 주기성). **금액 산술은 절대 LLM에 맡기지 않는다** — 환각이 발생하면 합계가 틀린다.
- **LLM**: ① 헤더 + 샘플 3행으로 컬럼 매핑 추론 ② 가맹점명 → 카테고리 분류(배치) ③ 집계된 **통계만** 입력으로 받아 AI 요약 + 절약 인사이트 + 이상거래 설명을 **1회 통합 호출**로 생성. 출력은 Zod 검증을 통과한 것만 사용한다.
- 응답은 일반 JSON이다. 분석은 20~60초이고 Vercel 함수는 300초까지 허용되므로 스피너 + "최대 1분 걸려요" 안내로 충분하다(SSE 불필요).

## 데이터 흐름
```
1. 로그인
   랜딩 → /login → Google OAuth → /auth/callback → 대시보드

2. CSV 분석
   업로드 → POST /api/analyze
   → 월 한도 검사 + 업로드 레코드 생성 (단일 트랜잭션)
   → 원본 암호화 후 Storage 저장
   → 파싱 (컬럼 매핑 추론 포함)
   → 코드 집계 → LLM 해석 → analysis_results 저장
   → 대시보드에서 플랜별로 트리밍해 렌더

3. 결제
   업그레이드 → POST /api/polar/checkout → Polar 결제
   → 복귀(?checkout=success) 시 Polar 1회 조회로 즉시 반영
   → webhook은 백업 경로 (서명 검증 + last_event_ts 비교)
```

## DB 스키마 (4테이블)

- `subscriptions` — user_id(unique, FK `auth.users`), plan(`free|pro`), polar_status, polar_customer_id, polar_subscription_id, cancel_at_period_end, current_period_end, last_event_id, last_event_ts, updated_at
- `csv_uploads` — id, user_id, original_filename, storage_path, encryption_meta(jsonb), file_size, row_count, status(`uploading|parsing|analyzing|completed|failed`), error_code, period_start, period_end, retry_count, uploaded_at
- `transactions` — id, upload_id, user_id, occurred_on, description, merchant_normalized, **amount numeric(14,2)**, category, created_at
- `analysis_results` — upload_id(unique), user_id, payload(jsonb: `aggregates` + `interpretation`), generated_at

RLS는 전 테이블 `auth.uid() = user_id`. 인덱스는 `transactions(upload_id)`, `csv_uploads(user_id, uploaded_at desc)`.

**금액은 반드시 `numeric(14,2)`를 쓴다. float은 반올림 오차가 생긴다.**

**월 한도 검사와 업로드 레코드 생성은 단일 트랜잭션**으로 처리해 동시 요청 우회를 막는다. 재시도는 같은 row를 재사용하므로 한도는 자동으로 1회만 차감된다.

## API

| 라우트 | 설명 |
|---|---|
| `POST /api/analyze` | multipart(≤4MB) → `{ uploadId }` |
| `POST /api/analyze/[id]/retry` | 파싱된 데이터 재사용, 재시도 3회 상한 |
| `GET /api/uploads` | 히스토리 목록 |
| `GET /api/uploads/[id]` | 리포트 상세 (플랜별 트리밍) |
| `POST /api/polar/checkout` | 체크아웃 세션 생성 (product ID는 서버 상수) |
| `POST /api/polar/webhook` | 서명 검증 후 구독 상태 갱신 |
| `GET /api/polar/portal` | 고객 포털 리다이렉트 |
| `POST /api/account/delete` | 계정·데이터 삭제 |

에러는 `{ error: { code, message } }` 단일 형식이며 code는 다음 중 하나다: `unauthorized | file_too_large | invalid_file_type | empty_file | encoding_error | parse_failed | upload_limit_reached | retry_limit_exceeded | analysis_failed | not_found`. **UI는 message 문자열이 아니라 code로 분기한다.**

Free 트리밍 규칙: anomaly는 상위 3건 + `totalCount`, savings는 상위 1건 + `totalCount`, 응답에 `locked: true`를 동봉한다.

## 상태 관리
- 서버 상태: Server Components + Supabase 직접 조회 (별도 캐싱 레이어 없음)
- 클라이언트 상태: 업로드 위젯 진행 상태 등은 useState로 로컬 관리
- 인증 세션: Supabase Auth 쿠키를 미들웨어에서 검증·갱신

## 보안 경계

- **원본 CSV**는 앱 레벨 AES-256-GCM으로 암호화해 Storage에 보관하되, **다운로드는 제공하지 않고 재분석 전용**이다. 경로는 `{user_id}/{uuid}.csv`로 생성하며 **원본 파일명을 경로에 쓰지 않는다**(path traversal).
- **파생 데이터(`transactions`)**는 Postgres at-rest 암호화 + RLS로 보호한다. 집계 쿼리가 가능해야 하므로 앱 레벨 암호화를 적용하지 않는다.
- 암호화 키는 env 단일 마스터 키라 **로테이션이 불가능하다**(MVP 한계). 키는 절대 로그에 남기지 않는다.
- **LLM에는 가맹점명(분류)과 집계 통계(해석)만 전송하며, 거래 원본 전체는 보내지 않는다.**
- **CSV 입력과 LLM 출력은 모두 신뢰 불가 입력이다.** 프롬프트에서 데이터 영역을 격리하고, LLM 출력은 Zod 검증 후 **플레인 텍스트로만 렌더**한다(마크다운·HTML 렌더 금지).
- 로그에 거래 내용·파일 내용·키를 남기지 않는다.
- MVP에서 의도적으로 제외: CSP 커스텀 헤더, 분당 rate limit, 감사 로그.
