# Step 8: analysis-orchestrator

## 읽어야 할 파일

- `/plan.md` — §3 분석 파이프라인과 요청 생명주기, §6 `ProcessUploadInput`·`StoredAnalysisPayload`
- `/docs/ARCHITECTURE.md` — 분석 파이프라인, 패턴(쓰기 경계)
- `/docs/USER_JOURNEY.md` — 2절 상태 머신
- `/docs/ADR.md` — ADR-007(`202 + after()`), ADR-010(dual-scope), ADR-011(원본 비보관)
- `/src/lib/csv/`, `/src/lib/analysis/`, `/src/lib/llm/`, `/src/lib/supabase/` — step 3·4·5·7의 산출물

## 작업

`src/lib/analysis/process-upload.ts`와 `src/lib/analysis/analysis-repository.ts`에 백그라운드 분석 작업을 구현한다. **앞선 step의 조각을 조립하는 것이 이 step의 역할**이며 새 도메인 로직을 만들지 마라. HTTP는 다루지 않는다 — 라우트는 step 9다.

1. **`processUpload(input: ProcessUploadInput, deps): Promise<void>`**

   `ProcessUploadInput`은 `{ uploadId, userId, accessToken, fileBytes }`다. 외부 의존(LLM 호출, DB 접근, 시계)은 `deps`로 주입받아라. 이 함수가 직접 클라이언트를 생성하면 테스트할 수 없다.

   순서를 지켜라.

   1. `transition_upload(uploadId, 'queued', 'parsing')`
   2. 컬럼 매핑 추론(step 7) → **코드로 의미 검증**(step 3) → 정규화
   3. 정규화된 `transactions`를 저장하고 `skippedRowCount`를 기록
   4. `transition_upload(uploadId, 'parsing', 'analyzing')`
   5. 가맹점 dedupe → 분류 batch(step 7) → `transactions.category` 갱신
   6. `recent12m`·`full` 두 scope 집계(step 4)
   7. 두 scope 해석 1회 호출(step 7)
   8. `analysis_results.payload` 저장 후 `completed`. **해석만 실패했으면 집계를 저장하고 `partial`로 둔다.**

2. **상태 전이는 반드시 `transition_upload` RPC로만 한다.** `csv_uploads`를 직접 UPDATE하지 마라. 실패 시에는 `error_code`를 metadata로 넘겨 `failed`로 전이한다.

3. **쓰기는 캡처된 사용자 access token으로 수행한다.** `transactions`와 `analysis_results` INSERT는 `WITH CHECK (auth.uid() = user_id)` 아래에서 이루어진다. service role 클라이언트를 쓰지 마라.

4. **내부 deadline 240초.** 초과하면 `analysis_timeout`으로 실패시킨다. 시계는 주입받아 fake clock으로 테스트할 수 있게 하라.

5. **부분 실패 처리**
   - 분류 batch 일부 실패 → 해당 가맹점 `other`, 나머지 분석 계속
   - 해석 실패 → `partial`, 집계는 보존
   - 파싱 전 실패 → `failed`. 원본을 보관하지 않으므로 재시도 대상이 아니다

6. **`analysis-repository.ts`** — transactions 저장, category 갱신, payload 저장을 담당한다. 쿼리를 `process-upload.ts`에 흩지 마라.

7. `fileBytes`와 `accessToken`을 **로그·DB·에러 메시지 어디에도 남기지 마라.** 함수가 끝나면 원본 바이트에 대한 참조가 남지 않아야 한다.

## Acceptance Criteria

```bash
npm run build
npm test
```

테스트는 최소한 다음을 포함해야 한다: `queued → parsing → analyzing → completed` 정상 경로, 해석 실패 시 `partial` + 집계 보존, 파싱 실패 시 `failed` + 적절한 `error_code`, 분류 batch 실패 시 `other` 폴백 후 진행, fake clock으로 240초 초과 시 `analysis_timeout`, 상태 전이가 모두 RPC를 거치는지, 원본 바이트가 저장 호출에 전달되지 않는지.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 상태 전이가 전부 `transition_upload`를 통하는가?
   - 쓰기가 service role이 아니라 사용자 토큰으로 이루어지는가?
   - `recent12m`과 `full`이 **각각 자체 집계와 그 집계만 본 해석**을 갖는가?
   - LLM 호출이 모두 모킹되어 테스트가 결정적인가?
3. `phases/0-mvp/index.json`의 step 8을 업데이트한다.

## 금지사항

- HTTP 라우트·`after()` 등록을 여기서 만들지 마라. 이유: step 9의 범위다. 이 함수는 순수하게 호출 가능해야 테스트된다.
- 원본 CSV를 Storage나 DB에 쓰지 마라. 이유: ADR-011에서 비보관으로 정했다.
- `csv_uploads`를 직접 UPDATE하지 마라. 이유: 상태 전이 규칙과 소유권 검사가 RPC 안에 있다.
- 잡 큐·워커·크론을 도입하지 마라. 이유: ADR-007에서 `after()` 하나로 처리하기로 했다.
- 실제 Anthropic API를 호출하는 테스트를 쓰지 마라. 이유: ADR-017. Stop 훅이 매 턴 테스트를 돌린다.
