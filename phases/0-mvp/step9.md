# Step 9: analyze-api

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md` — 데이터 흐름 2절, API 목록, 에러 코드
- `/docs/USER_JOURNEY.md` — 2절 상태 머신, 5절 엣지 케이스
- `/docs/ADR.md` — ADR-007(`202 + after()`·4MB), ADR-010(dual-scope + DB 트리밍)
- `/src/types/`, `/src/lib/csv/`, `/src/lib/analysis/`, `/src/lib/supabase/` — step 2~8의 산출물

## 작업

분석 파이프라인의 **HTTP 계층만** 구현한다. 실제 분석은 step 8의 `processUpload`가 하며, 여기서 새 도메인 로직을 만들지 마라.

1. **`POST /api/analyze`** (multipart, `4_000_000` bytes 이하) — 순서를 지켜라:
   1. 세션 검증 (없으면 `unauthorized`)
   2. 파일 타입·크기·인코딩·행/컬럼 기본 검증 (`invalid_file_type`, `file_too_large`, `empty_file`, `encoding_error`)
   3. **step 5의 `reserve_upload()` RPC로 월 한도 + 동시 1건 검사와 upload row 생성을 원자 처리** — 한도 초과는 `upload_limit_reached`, 이미 분석 중이면 `analysis_in_progress`
   4. 갱신된 access token을 캡처한다
   5. `after(processUpload({ uploadId, userId, accessToken, fileBytes }))`를 등록한다
   6. 응답은 **`202 { uploadId }`**. 분석 완료를 기다리지 마라
   - 라우트는 Node.js runtime, `maxDuration = 300`으로 설정한다.
2. **`POST /api/analyze/[id]/retry`** — 저장된 `transactions`를 재사용해 **분류·해석만** 다시 수행한다.
   - `claim_analysis_retry()` RPC가 소유권·재시도 가능 상태·3회 상한을 원자 검사한다. 초과 시 `retry_limit_exceeded`.
   - 재파싱·재업로드를 하지 않으므로 **월 한도를 다시 차감하지 않는다.**
   - 응답은 `202 { uploadId }`.
3. **`GET /api/uploads`** — 본인 업로드 metadata 목록.
4. **`GET /api/uploads/[id]`** — status와 리포트. **트리밍을 애플리케이션에서 하지 마라.**
   - `get_upload_report()` RPC 결과를 **그대로** 반환한다. plan 확인과 scope 선택, 티저 절단은 전부 DB 함수 안에서 일어난다.
   - 전체 payload를 읽어 코드에서 필드를 지우는 방식은 금지한다. `transactions`·`analysis_results`에는 SELECT 권한 자체가 없다.
   - active·failed 상태에서는 report가 `null`일 수 있다.
   - `queued|parsing|analyzing`으로 10분 이상 지난 업로드는 `mark_stale_upload()`로 실패 전환한 뒤 응답한다.
   - 이 라우트가 UI의 폴링 대상이다(2초·4초·이후 5초).
5. **공통 에러 처리** — 모든 라우트가 `{ error: { code, message } }` 형식을 쓴다. 로그에 **거래 내용·파일 내용·키·access token을 남기지 마라.**

## Acceptance Criteria

```bash
npm run build
npm test
```

테스트는 최소한 다음을 포함해야 한다: 미인증 요청 거부, `4_000_000` bytes 초과 거부, 한도 초과 시 `upload_limit_reached`, 이미 분석 중일 때 `analysis_in_progress`, 재시도 4회째 `retry_limit_exceeded`, **분석 완료를 기다리지 않고 `202`가 즉시 반환됨**, `after()`에 작업이 등록됨, `GET /api/uploads/[id]`가 RPC 결과를 가공 없이 반환함, 타 사용자 uploadId 접근 거부.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 한도·동시 실행 검사가 step 5의 `reserve_upload()`를 통하는가? (애플리케이션 레벨 count 후 insert는 동시 요청에 뚫린다)
   - 트리밍을 애플리케이션에서 하지 않고 `get_upload_report()` 결과를 그대로 넘기는가?
   - 파싱·집계·LLM 로직을 여기서 새로 구현하지 않고 step 8의 `processUpload`에 위임하는가?
   - `202`가 분석 완료 전에 반환되는가?
3. `phases/0-mvp/index.json`의 step 9를 업데이트한다.

## 금지사항

- SSE·스트리밍 응답을 만들지 마라. 이유: ADR-007에서 `202` + 폴링으로 정했다. 스트림은 시작 후 상태 코드를 바꿀 수 없어 에러 처리가 복잡해진다.
- 응답을 붙들고 분석 완료를 기다리지 마라. 이유: 탭을 닫으면 작업이 사라진다. row를 먼저 만들고 `after()`로 넘기는 것이 ADR-007의 핵심이다.
- 잡 큐·백그라운드 워커를 도입하지 마라. 이유: `after()` 하나로 처리하기로 했다.
- CSV 파싱·집계·분석 오케스트레이션을 이 파일에 구현하지 마라. 이유: step 3·4·8에 이미 있고, 두 벌이 되면 동작이 갈린다.
- 리포트 트리밍을 코드로 구현하지 마라. 이유: ADR-010에서 DB 권한으로 경계를 강제하기로 했다. 한 군데만 빠뜨려도 유료 데이터가 샌다.
- 클라이언트가 보낸 plan 값을 신뢰하지 마라. 이유: 구독 상태는 항상 DB에서 조회해야 한다.
