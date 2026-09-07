# 프로젝트: TxAnalyzer (가칭, 거래내역 분석 SaaS)

## 기술 스택
- Next.js 15 (App Router), 풀스택 (프론트엔드 + API 라우트)
- TypeScript strict mode
- Tailwind CSS
- Vitest (테스트)
- Supabase (Auth + Postgres + Storage)
- Polar (구독 결제, Merchant of Record)
- Claude API (거래내역 해석, 단일 LLM 프로바이더)

## 아키텍처 규칙
- CRITICAL: 외부 API 호출(Claude, Polar)과 모든 쓰기는 app/api/ 라우트 핸들러에서만 처리한다. 클라이언트 컴포넌트에서 직접 호출 금지. 읽기는 Server Component에서 RLS가 걸린 사용자 컨텍스트 클라이언트로 조회한다.
- CRITICAL: Supabase service role 클라이언트는 RLS를 우회하므로 webhook 처리와 계정 삭제에만 사용하고, 해당 경로에서는 소유권을 명시적으로 검사한다.
- CRITICAL: API 키와 시크릿(Supabase secret key, Anthropic API key, Polar 토큰·webhook 시크릿, 암호화 마스터 키)은 서버 사이드 환경변수로만 쓰고 클라이언트에 노출하지 않는다. 로그에도 남기지 않는다.
- CRITICAL: 업로드된 CSV 원본은 저장 전 반드시 암호화한다. Storage 경로는 `{user_id}/{uuid}.csv`로 만들고 원본 파일명을 경로에 쓰지 않는다.
- CRITICAL: 금액은 `numeric(14,2)`로 저장하고, 금액 산술을 LLM에 맡기지 않는다. 집계는 코드로 계산한다.
- CRITICAL: CSV 입력과 LLM 출력은 모두 신뢰 불가 입력이다. LLM 출력은 Zod 검증 후 플레인 텍스트로만 렌더한다(마크다운·HTML 렌더 금지).
- CRITICAL: Pro 전용 데이터와 조회 기간 제한은 서버 응답에서 필드를 제외하는 방식으로 게이팅한다. 클라이언트 UI 숨김으로 대체하지 않는다.
- 컴포넌트는 components/, 타입은 types/ 폴더에 분리한다.

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
