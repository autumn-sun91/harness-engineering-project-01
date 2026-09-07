# Step 14: deploy-production

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md` — 보안 경계 (배포 전 점검 항목의 근거)
- `/docs/ADR.md` — ADR-007(Vercel 제약), ADR-013(배포 배치), **ADR-014(Vercel Pro 필수), ADR-015(Polar 심사 선행)**
- `/.env.example` — production에 설정해야 할 환경변수 키 목록
- `/phases/0-mvp/index.json` — step 1의 `summary`에 남은 Vercel 프로젝트 정보

## 작업

step 1에서 preview로 올린 프로젝트를 production으로 승격한다. **배포 전에 보안 점검을 먼저 통과해야 한다.**

1. **보안 점검 (실패하면 배포하지 말고 `error`로 기록하라)**
   - 서명이 없거나 위조된 요청으로 `/api/polar/webhook`을 호출했을 때 401이 반환되고 구독 상태가 변하지 않는가?
   - 타 사용자의 uploadId로 `GET /api/uploads/[id]`를 호출하면 거부되는가?
   - `/login?redirect=https://evil.com`, `//evil.com`이 외부로 나가지 않는가?
   - Free 계정의 `GET /api/uploads/[id]` 응답에 Pro 전용 필드가 **존재하지 않는가**?
   - 클라이언트 번들에 서버 전용 시크릿(`SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `POLAR_*`, 암호화 마스터 키)이 포함되지 않았는가? 빌드 산출물에서 문자열을 검색해 확인하라.
   - `.env`가 커밋되지 않았는가?
2. **Vercel 환경변수 설정** — `.env.example`의 모든 키를 production 환경에 설정한다. 값은 사용자가 제공해야 하므로, 값을 모르는 키가 있으면 **`blocked`로 기록하고 어떤 키가 필요한지 명시하라.** 임의의 값을 채워 넣지 마라.
   - `NEXT_PUBLIC_APP_URL`은 production 도메인으로 설정한다.
3. **OAuth 리다이렉트 URL 정리** — Supabase Auth와 Google Cloud Console의 허용 리다이렉트 URL에 production 도메인의 `/auth/callback`이 등록되어야 한다. 코드로 확인할 수 없으므로 필요한 URL을 `summary`에 정확히 적어 사용자가 등록할 수 있게 하라.
4. **Polar webhook 엔드포인트** — production 도메인의 `/api/polar/webhook`으로 등록되어야 한다. 필요한 URL을 `summary`에 적어라.
5. **Vercel Pro 플랜 확인 (배포 전 필수)**
   - Vercel 이용약관 §4와 Fair Use 가이드라인은 **Hobby 플랜을 비상업적 개인 용도로만** 허용하며, 상업적 사용의 첫 번째 예시가 **"사이트 방문자로부터 결제를 요청하거나 처리하는 모든 행위"**다. Polar 결제를 켜는 순간 Hobby는 약관 위반이고, 정책 위반으로 정지되면 `503 DEPLOYMENT_PAUSED`가 뜨며 **자동으로 복구되지 않는다.**
   - 또한 Hobby와 Pro 체험판은 약관상 **콘텐츠가 Vercel의 AI 모델 학습에 사용되고 제3자와 공유될 수 있다.** 유료 Pro에서는 기본 비활성이다. 사용자의 거래 데이터를 다루는 서비스에서 이 차이는 무시할 수 없다.
   - 현재 플랜을 확인하고 Hobby라면 **배포하지 말고 `blocked`로 기록하라.** `blocked_reason`에 "결제 활성화 전 Vercel Pro 전환 필요(약관 §4 상업적 사용 제한)"를 명시한다.
   - 순서를 지켜라: **Polar 심사 승인 → Vercel Pro 전환 → production 배포 → 결제 활성화.**
6. **Polar production 전환 확인**
   - `POLAR_SERVER`가 `sandbox`로 남아 있으면 실제 결제가 이뤄지지 않는다. production 승인이 났는지 확인하고 `POLAR_SERVER=production`과 **production용 액세스 토큰·상품 ID·webhook 시크릿**이 설정됐는지 검사하라. 샌드박스 값은 production에서 동작하지 않는다.
   - 승인이 아직이면 `blocked`로 기록하라. 심사는 최대 14일이므로 **step 1에서 이미 제출을 요청했어야 한다**(step 1의 `summary` 확인).
   - production webhook 시크릿은 2026-09-08 이후 발급되므로 Standard Webhooks 규격이다. step 11이 SDK 검증기를 쓰고 있는지 확인하라.
7. **production 배포**
   ```bash
   npx vercel deploy --prod
   ```
8. **배포 후 확인** — production URL이 200을 반환하고 랜딩이 렌더되는지, Fluid compute가 활성이라 함수 실행 한도가 300초인지 확인한다.

## Acceptance Criteria

```bash
npm run build
npm test
npm run lint
npx vercel whoami
```

production URL이 HTTP 200을 반환해야 한다.

## 검증 절차

1. 위 AC 커맨드와 1번의 보안 점검을 모두 수행한다.
2. 배포된 production URL에서 랜딩 → `/login` 이동까지 확인한다.
3. `phases/0-mvp/index.json`의 step 14를 업데이트한다.
   - 성공 → `"status": "completed"`, `"summary"`에 **production URL과 사용자가 직접 등록해야 할 설정(OAuth 리다이렉트 URL, Polar webhook URL)** 을 명시
   - Vercel 인증·환경변수 값이 없으면 → `"status": "blocked"` + 필요한 항목을 구체적으로 나열
   - 보안 점검 실패 → `"status": "error"` + 어떤 점검이 실패했는지 기록 (**배포하지 마라**)

## 금지사항

- 보안 점검을 통과하지 못한 상태로 `--prod` 배포를 하지 마라. 이유: 결제 위조나 타 사용자 데이터 노출이 실제 사용자에게 노출된다.
- Hobby 플랜 상태에서 결제를 활성화한 채 production 배포를 하지 마라. 이유: Vercel 약관 §4 위반이고, 정책 위반 정지는 자동 복구되지 않는다.
- 샌드박스 Polar 자격증명으로 production 배포를 하지 마라. 이유: 실제 결제가 처리되지 않아 사용자는 결제한 줄 알지만 구독이 생기지 않는다.
- production에서 실제 카드로 테스트 결제를 하지 마라. 이유: 카드 테스팅으로 탐지되어 Polar 계정이 재심사에 걸린다. 100% 할인 쿠폰이나 무료 상품을 쓴다.
- 모르는 환경변수 값을 임의로 채우거나 더미 값으로 배포하지 마라. 이유: 런타임에 실패하고, 잘못된 키로 외부 서비스에 요청이 나간다.
- 보안 점검을 통과시키기 위해 검사 자체를 완화하거나 테스트를 수정하지 마라. 이유: 문제를 숨기는 것이다. 원인을 고쳐라.
- 대화형 로그인을 시도하지 마라. 이유: 헤드리스 세션이다. 인증이 없으면 `blocked`가 정답이다.
