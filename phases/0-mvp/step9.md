# Step 9: analyze-api

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md` — 데이터 흐름 2절, API 목록, 에러 코드
- `/docs/USER_JOURNEY.md` — 2절 상태 머신, 5절 엣지 케이스
- `/docs/ADR.md` — ADR-007(동기 처리·4MB), ADR-010
- `/src/types/`, `/src/lib/csv/`, `/src/lib/analysis/`, `/src/lib/crypto/`, `/src/services/` — step 2~8의 산출물

## 작업

분석 파이프라인 API를 구현한다. 앞선 step들의 조각을 **조립하는 것이 이 step의 역할**이며, 새 도메인 로직을 여기서 만들지 마라.

1. **`POST /api/analyze`** (multipart, 4MB 이하) — 순서를 지켜라:
   1. 세션 검증 (없으면 `unauthorized`)
   2. 파일 타입·크기 검사 (`invalid_file_type`, `file_too_large`)
   3. **step 6의 원자적 함수로 월 한도 검사 + `csv_uploads` 행 생성**(`status='uploading'`) — 초과 시 `upload_limit_reached`
   4. 원본 암호화 후 Storage 업로드 → 실패 시 행을 `failed`로 갱신 (**행을 먼저 만들고 파일을 나중에 올린다. 고아 파일보다 고아 행이 낫다**)
   5. `status='parsing'` → LLM 컬럼 매핑 추론 → 파싱 → `transactions` 저장
   6. `status='analyzing'` → 카테고리 분류 → 코드 집계 → LLM 해석
   7. `analysis_results` 저장 후 `status='completed'`. **해석만 실패했으면 `interpretation: null`로 저장하고 그래도 `completed`로 둔다.**
   8. 응답은 `{ uploadId }`
2. **`POST /api/analyze/[id]/retry`** — 이미 저장된 `transactions`를 재사용해 **해석만** 다시 수행한다.
   - 소유권을 검사한다.
   - `retry_count`가 3 이상이면 `retry_limit_exceeded`.
   - 재파싱·재업로드를 하지 않으므로 **월 한도를 다시 차감하지 않는다.**
3. **`GET /api/uploads`** — 본인 업로드 목록.
4. **`GET /api/uploads/[id]`** — 리포트 상세. **플랜별 트리밍을 서버에서 수행한다**:
   - Free: 이상거래는 상위 3건 + `totalCount`, 절약 인사이트는 상위 1건 + `totalCount`, `locked: true`
   - Free: 조회 기간을 최근 12개월로 제한
   - **응답 객체에서 필드를 실제로 제거하라.** 플래그만 달아 보내면 안 된다.
   - `analyzing` 상태로 10분 이상 지난 업로드는 실패로 간주해 응답한다.
5. **공통 에러 처리** — 모든 라우트가 `{ error: { code, message } }` 형식을 쓴다. 로그에 **거래 내용·파일 내용·키를 남기지 마라.**

## Acceptance Criteria

```bash
npm run build
npm test
```

테스트는 최소한 다음을 포함해야 한다: 미인증 요청 거부, 4MB 초과 거부, 한도 초과 시 `upload_limit_reached`, 재시도 4회째 `retry_limit_exceeded`, **Free 응답에 Pro 전용 필드가 존재하지 않음**, 타 사용자 uploadId 접근 거부, 해석 실패 시 `completed` + `interpretation: null`.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 한도 검사가 step 6의 원자적 함수를 통하는가? (애플리케이션 레벨 count 후 insert는 동시 요청에 뚫린다)
   - Free 트리밍이 서버에서 필드를 제거하는 방식인가?
   - 파싱·집계·LLM 로직을 여기서 새로 구현하지 않고 기존 모듈을 호출하는가?
3. `phases/0-mvp/index.json`의 step 9를 업데이트한다.

## 금지사항

- SSE·스트리밍 응답을 만들지 마라. 이유: ADR-007에서 일반 JSON + 스피너로 정했다. 스트림은 시작 후 상태 코드를 바꿀 수 없어 에러 처리가 복잡해진다.
- 잡 큐·백그라운드 워커를 도입하지 마라. 이유: 300초 한도 안에서 동기 처리하기로 했다.
- CSV 파싱이나 집계 로직을 이 파일에 다시 구현하지 마라. 이유: step 3·4에 이미 있고, 두 벌이 되면 동작이 갈린다.
- 클라이언트가 보낸 plan 값을 신뢰하지 마라. 이유: 구독 상태는 항상 DB에서 조회해야 한다.
