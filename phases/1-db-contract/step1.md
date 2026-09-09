# Step 1: status-vocabulary

## 읽어야 할 파일

먼저 아래 파일들을 읽고 현재 어휘가 어떻게 갈라져 있는지 파악하라:

- `/plan.md` — §5 `ErrorCode` 15개, §6 `UploadStatus` 6개가 정본이다
- `/docs/ARCHITECTURE.md` — 업로드 상태 전이와 API 계약
- `/src/types/constants.ts` — `UPLOAD_STATUSES`, `API_ERROR_CODES` 정본이 있어야 할 자리
- `/src/types/dashboard.ts` — `DASHBOARD_UPLOAD_STATUSES`가 중복 정의되어 있다
- `/src/types/core-types.test.ts` — 현재 어휘를 검증하는 테스트
- `/src/components/upload/upload-errors.ts` — 에러 코드별 한국어 문구
- `/src/app/api/analyze/route.ts`, `/src/app/api/analyze/[id]/retry/route.ts` — 라우트별로 재선언된 에러 코드 맵
- `/src/lib/analysis/process-upload.ts` (78행 부근) — 지역 에러 코드 union
- `/src/app/api/uploads/[id]/route.ts`, `/src/app/(dashboard)/dashboard/page.tsx`, `/src/components/dashboard/dashboard-client.tsx`, `/src/components/upload/upload-dropzone.tsx` — `"uploading"` 리터럴 사용처
- `/supabase/migrations/0007_upload_contract_rpcs.sql` — 이 phase의 step 0이 확정한 DB 어휘

## 배경

같은 개념에 서로 다른 어휘가 공존한다.

**업로드 상태:**

| 출처 | 값 |
|---|---|
| `plan.md` §6 (정본) | `queued` `parsing` `analyzing` `partial` `completed` `failed` |
| `src/types/constants.ts` | `uploading` `parsing` `analyzing` `completed` `failed` — `queued`·`partial` 없음 |
| `src/types/dashboard.ts` | 위 둘의 합집합 7개 |

`src/types/dashboard.ts`는 불일치를 해소하는 대신 합집합을 만들어 덮었다. 그 결과 `partial`은 앱에서만 존재하고 DB에는 없었다.

**에러 코드:** `src/types/constants.ts`의 `API_ERROR_CODES`는 10개뿐인데 `plan.md` §5의 정본은 15개다. 누락된 `column_mapping_failed`, `mixed_currency`, `unsupported_transaction_semantics`, `analysis_in_progress`, `analysis_timeout` 5개는 **이미 앱 곳곳에서 쓰이고 있다** — `upload-errors.ts`, `analyze/route.ts`, `retry/route.ts`, `process-upload.ts`가 각자 지역 union이나 리터럴로 재선언했다.

이 step은 두 어휘를 `src/types/constants.ts` 한 곳으로 정본화한다. step 0이 DB를 정본에 맞췄으므로 이제 앱을 맞춘다.

## 작업

**TDD 순서를 지켜라. 먼저 `src/types/core-types.test.ts`를 정본 기준으로 고쳐 실패시킨 뒤 구현하라.**

### 1. `src/types/constants.ts` 정본화

```ts
export const UPLOAD_STATUSES = [
  "queued", "parsing", "analyzing", "partial", "completed", "failed",
] as const;

export const API_ERROR_CODES = [
  "unauthorized", "file_too_large", "invalid_file_type", "empty_file",
  "encoding_error", "parse_failed", "column_mapping_failed", "mixed_currency",
  "unsupported_transaction_semantics", "upload_limit_reached",
  "analysis_in_progress", "retry_limit_exceeded", "analysis_timeout",
  "analysis_failed", "not_found",
] as const;
```

`"uploading"`은 제거한다. 정본은 `"queued"`다.

### 2. `src/types/dashboard.ts`에서 중복 제거

`DASHBOARD_UPLOAD_STATUSES`와 `DashboardUploadStatus`를 삭제하고 `constants.ts`의 `UploadStatus`를 쓰도록 바꾼다. 두 개의 상태 union이 공존하는 상태를 남기지 마라.

### 3. `"uploading"` 사용처를 `"queued"`로 교체

다음 파일들에 리터럴이 남아 있다. 전부 정본으로 바꾼다.

```
src/app/(dashboard)/dashboard/page.tsx
src/app/api/uploads/[id]/route.ts
src/components/dashboard/dashboard-client.tsx
src/components/upload/upload-dropzone.tsx
src/types/core-types.test.ts
```

작업 후 아래가 비어야 한다:

```bash
grep -rn '"uploading"' src
```

### 4. 지역 에러 코드 선언을 정본에서 파생시키기

`src/lib/analysis/process-upload.ts`의 지역 union과 `analyze/route.ts`·`retry/route.ts`의 에러 코드 맵이 `ApiErrorCode`에서 파생되도록 바꾼다. 같은 문자열 집합을 두 번 적는 자리를 남기지 마라.

`src/components/upload/upload-errors.ts`의 문구 맵은 `Record<ApiErrorCode, string>`으로 선언해 **코드가 추가되면 컴파일이 실패하도록** 만들어라. 이유: 문구 누락을 타입 검사로 잡기 위해서다.

### 5. `partial` 상태가 UI에서 처리되는지 확인

`partial`은 "해석은 실패했지만 결정론적 집계는 저장된" 상태다. 대시보드가 이 상태에서 집계 카드를 렌더하고 해석 카드에 재시도 버튼을 보여주는지 확인하라. 이미 그렇게 되어 있으면 **건드리지 마라.** 되어 있지 않은 부분만 고쳐라.

## Acceptance Criteria

```bash
npm run lint
npm run build
npm test
grep -rn '"uploading"' src   # 출력이 없어야 한다 (exit 1)
```

`npm test`는 step 0까지의 기존 테스트를 포함해 전부 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - `UPLOAD_STATUSES`가 정확히 6개이고 `supabase/migrations/0007_upload_contract_rpcs.sql`의 check 제약과 같은 집합인가?
   - `API_ERROR_CODES`가 정확히 15개이고 `plan.md` §5와 같은가?
   - 상태·에러 코드 union이 저장소에 **한 번씩만** 정의되어 있는가?
   - `upload-errors.ts`가 `Record<ApiErrorCode, string>`으로 전수 보장되는가?
3. `phases/1-db-contract/index.json`의 step 1을 갱신한다.
   - 성공 → `"status": "completed"`, `"summary"`에 통일된 어휘와 수정한 파일을 한 줄로 요약
   - 3회 시도 후 실패 → `"status": "error"` + `"error_message"`

## 금지사항

- `supabase/` 아래 SQL을 수정하지 마라. 이유: DB 어휘는 이 phase의 step 0에서 확정됐다. 앱을 DB에 맞추는 것이 이 step의 방향이다.
- 카테고리(`식비`·`교통` 등 8종)나 `kind`(`debit`/`credit`) 어휘를 바꾸지 마라. 이유: 이 step의 범위가 아니고, 건드리면 phase 0-mvp의 step 3·4·7·8 파서·집계·분류 코드와 테스트가 광범위하게 깨진다.
- 어휘 통일을 핑계로 컴포넌트 구조나 API 응답 형태를 리팩터링하지 마라. 이유: 이 step은 문자열 집합의 정본화만 다룬다.
- 테스트를 어휘에 맞춰 삭제하지 마라. 값을 갱신하라. 이유: 검증 범위가 줄어든다.
- 기존 테스트를 깨뜨리지 마라.
