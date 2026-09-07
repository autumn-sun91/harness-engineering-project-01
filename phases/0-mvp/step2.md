# Step 2: core-types

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md` — DB 스키마, API 목록, 에러 코드 계약
- `/docs/PRD.md` — Free/Pro 플랜 매트릭스
- `/docs/USER_JOURNEY.md` — 업로드 상태 머신
- `/src/types/` — step 0에서 만든 빈 디렉토리

## 작업

이후 모든 step이 공유할 도메인 타입과 API 계약을 `src/types/`에 정의한다. **타입 정의와 상수만 만들고 로직은 작성하지 마라.**

1. **도메인 타입** — `docs/ARCHITECTURE.md`의 DB 스키마와 1:1로 대응하게 정의한다.
   - `Subscription` (plan: `'free' | 'pro'`)
   - `CsvUpload` (status: `'uploading' | 'parsing' | 'analyzing' | 'completed' | 'failed'`)
   - `Transaction` — **금액 필드는 문자열 또는 정밀도를 보존하는 타입으로 다룬다. JS `number`로 통화를 계산하지 않도록 주석 한 줄로 의도를 남겨라.**
   - `AnalysisResult` — `payload`는 `aggregates`와 `interpretation` 두 부분으로 나뉘고, **`interpretation`은 `null`이 될 수 있다**(LLM 해석 실패 시)
2. **분석 결과 타입** — 5종 분석의 형태를 정의한다.
   - `aggregates`: 카테고리별 지출, 기간별 추이, 반복결제 후보 (코드가 생성)
   - `interpretation`: AI 요약, 절약 인사이트 배열, 이상거래 설명 배열 (LLM이 생성)
3. **카테고리 enum** — LLM 분류 결과를 검증할 고정 카테고리 목록을 상수로 정의한다(예: 식비, 교통, 주거, 통신, 의료, 쇼핑, 구독, 기타). 자유 문자열을 허용하지 마라.
4. **API 계약**
   - 에러 코드 union 타입: `unauthorized | file_too_large | invalid_file_type | empty_file | encoding_error | parse_failed | upload_limit_reached | retry_limit_exceeded | analysis_failed | not_found`
   - 에러 응답 형태: `{ error: { code, message } }`
   - `GET /api/uploads/[id]` 응답 타입 — Free 트리밍을 표현할 수 있어야 한다(이상거래 상위 3건 + `totalCount`, 절약 인사이트 상위 1건 + `totalCount`, `locked: boolean`)
5. **플랜 한도 상수** — 월 업로드 5회, 조회 12개월, 재시도 3회, 파일 4MB, 행 50,000, 컬럼 50. 하드코딩이 여기저기 흩어지지 않도록 한 곳에 모은다.

타입이 스키마·에러 코드와 일치하는지 확인하는 간단한 테스트를 작성하라(예: 카테고리 enum과 한도 상수에 대한 스냅샷 수준의 검증).

## Acceptance Criteria

```bash
npm run build
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 에러 코드 목록이 `docs/ARCHITECTURE.md`와 정확히 일치하는가?
   - 업로드 상태값이 5개(`uploading|parsing|analyzing|completed|failed`)뿐인가?
   - `interpretation`이 `null` 가능하도록 정의됐는가?
3. `phases/0-mvp/index.json`의 step 2를 업데이트한다. `"summary"`에 생성된 타입 파일 경로와 주요 export 이름을 남겨라.

## 금지사항

- 함수 구현, API 라우트, React 컴포넌트를 만들지 마라. 이유: 이 step은 타입 계약만 정의한다.
- 상태값이나 에러 코드를 문서에 없는 것으로 늘리지 마라. 이유: 상태가 늘면 UI 분기와 테스트가 함께 늘어난다. 부분 실패는 `completed` + `interpretation: null`로 표현한다.
- 금액을 `number` 타입으로 정의하지 마라. 이유: 부동소수점 반올림 오차로 합계가 틀어진다.
