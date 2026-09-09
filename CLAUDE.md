# 프로젝트: TxAnalyzer (가칭, 거래내역 분석 SaaS)

## 기술 스택
- Next.js `15.5.24` (App Router), 풀스택 (프론트엔드 + API 라우트)
- TypeScript strict mode
- Tailwind CSS
- Vitest (단위·통합 테스트), Playwright (E2E)
- Supabase (Auth + Postgres). **Storage는 쓰지 않는다** — 원본 CSV를 보관하지 않기 때문이다.
- Polar (구독 결제, Merchant of Record)
- Claude API `claude-sonnet-5` (거래내역 해석, 단일 LLM 프로바이더)
- Vercel Fluid Compute (Node.js runtime, `maxDuration = 300`)

## 아키텍처 규칙
- CRITICAL: 업로드된 CSV 원본은 메모리에서만 처리하고 Storage·DB에 저장하지 않는다. 성공·실패 어느 경로에서도 원본과 그 경로가 남아서는 안 된다. 재다운로드와 파싱 전 실패의 재시도는 제공하지 않는다.
- CRITICAL: 외부 API 호출(Claude, Polar)은 app/api/ 라우트 핸들러와 `after()` 백그라운드 작업에서만 처리한다. 클라이언트 컴포넌트에서 직접 호출 금지. 사용자 요청 경로의 쓰기는 RPC(`reserve_upload`, `transition_upload`, `claim_analysis_retry`, `mark_stale_upload`)를 거치고, `subscriptions`·`csv_uploads`의 직접 INSERT/UPDATE/DELETE는 금지한다.
- CRITICAL: `transactions`와 `analysis_results`에는 authenticated role의 SELECT 권한을 주지 않는다. 리포트는 security-definer RPC `get_upload_report()`로만 읽는다. 직접 조회가 허용되는 것은 `subscriptions`와 `csv_uploads` metadata뿐이며, RLS가 걸린 사용자 컨텍스트 클라이언트로 읽는다.
- CRITICAL: Supabase service role 클라이언트는 RLS를 우회하므로 webhook 처리와 계정 삭제에만 사용하고, 해당 경로에서는 소유권을 명시적으로 검사한다.
- CRITICAL: API 키와 시크릿(Supabase secret key, Anthropic API key, Polar 토큰·webhook 시크릿)은 서버 사이드 환경변수로만 쓰고 클라이언트에 노출하지 않는다. 로그에 키·access token·거래 내용·파일 내용을 남기지 않는다.
- CRITICAL: 금액은 `numeric(14,2)`로 저장하고 JavaScript `number`로 산술하지 않는다(decimal string으로 처리). 금액 산술을 LLM에 맡기지 않고 집계는 코드로 계산한다.
- CRITICAL: CSV 입력과 LLM 출력은 모두 신뢰 불가 입력이다. LLM 출력은 Structured Outputs와 Zod 양쪽으로 검증한 뒤 플레인 텍스트로만 렌더한다(마크다운·HTML 렌더 금지).
- CRITICAL: Pro 게이팅과 조회 범위 제한은 DB 함수가 허용 scope(`recent12m`/`full`)와 티저만 반환하는 방식으로 한다. 애플리케이션이 전체 payload를 읽어 클라이언트 UI로 숨기는 방식은 금지한다.
- 컴포넌트는 components/, 타입은 types/ 폴더에 분리한다. 디자인 토큰과 UI 규칙은 `docs/DESIGN.md`를 따른다.

## 개발 프로세스
- CRITICAL: 새 기능 구현 시 반드시 테스트를 먼저 작성하고, 테스트가 통과하는 구현을 작성할 것 (TDD)
- CRITICAL: `npm test`에서 실제 Anthropic API를 호출하지 않는다. LLM 호출은 모킹한다. 실제 호출이 필요한 분류 품질 검증은 `npm run eval`로 분리한다. 이유: Stop 훅이 매 턴 `lint && build && test`를 실행하므로 비용이 나가고, 모델 출력이 비결정적이라 무관한 커밋에서 실패한다.
- CRITICAL: 개발 중 실제 카드 명세서를 업로드하지 않는다. 합성 CSV만 쓴다. 이유: Vercel Hobby와 Pro 체험판은 약관상 콘텐츠가 AI 모델 학습에 사용되고 제3자와 공유될 수 있다.
- 커밋 메시지는 conventional commits 형식을 따를 것 (feat:, fix:, docs:, refactor:)
- 프로토타입이다. 요청되지 않은 기능·추상화·최적화를 넣지 않는다.

## 명령어
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
npm run test     # 테스트 (LLM 호출은 모킹. 결정적이고 빠르다)
npm run eval     # 분류 품질 평가 (실제 Anthropic API 호출, 수동 실행)

## 사람이 해야 하는 일 (Claude가 할 수 없음)

- [ ] **Polar production 심사 제출** — step 1(preview 배포) 직후 **즉시** 제출한다. KYC(대표자 신분증 + 셀피)와 Stripe Connect 정산 계좌가 필요하고 **최대 14일** 걸린다. 샌드박스와 production은 분리된 서버라 계정·토큰·상품·시크릿 중 넘어오는 것이 없다. step 14까지 미루면 일정이 2주 밀린다. (ADR-015)
- [ ] **Vercel Pro 전환** — Polar 승인 직후, **결제를 활성화하기 전에.** Hobby는 약관상 결제 처리가 금지되고, Hobby·Pro 체험판은 콘텐츠가 AI 학습에 쓰일 수 있다. (ADR-014)
- [ ] **`npm run eval` 라벨링 샘플 정답 검수** — 실제 카드 명세서를 아는 사람이 20~30건의 정답을 확인해야 평가가 의미를 갖는다. 이것이 분류 품질의 상한이다. (ADR-017)
- [ ] **OAuth 리다이렉트 URL / Polar webhook URL 등록** — step 14의 `summary`에 필요한 URL이 기록된다.
