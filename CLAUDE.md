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
- 커밋 메시지는 conventional commits 형식을 따를 것 (feat:, fix:, docs:, refactor:)
- 프로토타입이다. 요청되지 않은 기능·추상화·최적화를 넣지 않는다.

## 명령어
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
npm run test     # 테스트
