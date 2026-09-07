# Step 10: dashboard-ui

## 읽어야 할 파일

- `/docs/USER_JOURNEY.md` — 1절 여정, 2절 상태 머신, 5절 엣지 케이스 (**이 step의 사양서다**)
- `/docs/PRD.md` — Free/Pro 매트릭스
- `/docs/ARCHITECTURE.md` — 읽기는 Server Component, 보안 경계(LLM 출력 렌더 규칙)
- `/src/types/` — API 응답 타입, 에러 코드
- `/src/app/api/` — step 9의 라우트
- `/src/app/page.tsx` — step 0의 랜딩

## 작업

대시보드 화면을 구현한다.

1. **대시보드 홈**
   - **Empty state**: 업로드 이력이 없으면 업로드 CTA만 보여준다. 에러처럼 보이지 않게 하라.
   - 이력이 있으면 최근 리포트를 렌더한다.
   - 읽기는 Server Component에서 Supabase를 직접 조회한다.
2. **업로드 위젯** (Client Component)
   - 파일 선택/드래그, 클라이언트 사전 검증(확장자, 4MB).
   - 업로드 중에는 스피너와 **"분석 중입니다. 최대 1분 정도 걸려요"** 안내를 보여준다. 가짜 진행률을 만들지 마라.
   - 실패 시 **에러 `code`로 분기**해 안내를 다르게 보여준다(`file_too_large`, `empty_file`, `encoding_error`, `parse_failed`, `upload_limit_reached`, `retry_limit_exceeded`). message 문자열을 파싱하지 마라.
   - `upload_limit_reached`면 업그레이드 유도 모달을 띄운다.
3. **결과 5카드** — 카테고리별 지출, 기간별 추이, AI 요약, 이상거래/구독 누수, 절약 인사이트.
   - 차트가 필요하면 가벼운 라이브러리 하나만 쓰거나 SVG로 직접 그려라.
   - **Free 티저**: 서버가 이미 트리밍한 응답을 그대로 렌더한다. 이상거래는 "N건 발견" + 상세 3건, 절약 인사이트는 1건을 보여주고, 나머지는 잠금 상태로 표시하며 업그레이드 CTA를 붙인다. **클라이언트에서 숨기는 방식으로 구현하지 마라.**
   - **부분 실패**: `interpretation`이 `null`이면 카테고리·추이 카드는 정상 렌더하고, 해석이 필요한 카드에만 실패 안내와 재시도 버튼을 보여준다.
4. **히스토리 목록과 리포트 상세** — 과거 업로드를 조회한다.
5. **LLM 출력 렌더 규칙 (필수)** — AI 요약·인사이트·이상거래 설명은 **플레인 텍스트로만** 렌더한다. 마크다운 렌더러나 `dangerouslySetInnerHTML`을 쓰지 마라. 텍스트 안의 URL을 자동 링크로 변환하지도 마라.
6. **에러 바운더리** — `error.tsx`, `not-found.tsx`를 배치한다.

## Acceptance Criteria

```bash
npm run build
npm test
```

테스트는 최소한 다음을 포함해야 한다: empty state 렌더, 에러 코드별 안내 분기, `interpretation: null`일 때 집계 카드는 렌더되고 해석 카드만 실패 표시, Free 응답에서 잠금 UI 표시.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - LLM 텍스트가 마크다운/HTML로 렌더되지 않는가?
   - 플랜 분기를 클라이언트에서 판단하지 않고 서버 응답을 그대로 쓰는가?
   - `docs/USER_JOURNEY.md`의 엣지 케이스가 화면에 반영됐는가?
3. `phases/0-mvp/index.json`의 step 10을 업데이트한다.

## 금지사항

- `dangerouslySetInnerHTML`이나 마크다운 렌더러로 LLM 출력을 표시하지 마라. 이유: 프롬프트 인젝션으로 삽입된 피싱 링크나 스크립트가 실행될 수 있다.
- 클라이언트에서 Pro 데이터를 받아놓고 CSS로 가리지 마라. 이유: 개발자 도구로 그대로 보인다. 서버가 이미 필드를 제거해서 보낸다.
- 상태 관리 라이브러리(Redux, Zustand 등)를 도입하지 마라. 이유: 화면 로컬 상태뿐이라 useState로 충분하다.
- 통합 대시보드(여러 업로드 합산 뷰)나 PDF 내보내기를 만들지 마라. 이유: MVP 범위에서 제외했다(`docs/PRD.md`).
- 거래 원본 목록 화면을 만들지 마라. 이유: MVP는 집계 결과만 보여준다.
