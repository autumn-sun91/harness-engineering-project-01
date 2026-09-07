# Step 14: deploy-production

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md` — 보안 경계 (배포 전 점검 항목의 근거)
- `/docs/ADR.md` — ADR-007(Vercel 제약), ADR-013(배포 배치)
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
5. **production 배포**
   ```bash
   npx vercel deploy --prod
   ```
6. **배포 후 확인** — production URL이 200을 반환하고 랜딩이 렌더되는지, Fluid compute가 활성이라 함수 실행 한도가 300초인지 확인한다.

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
- 모르는 환경변수 값을 임의로 채우거나 더미 값으로 배포하지 마라. 이유: 런타임에 실패하고, 잘못된 키로 외부 서비스에 요청이 나간다.
- 보안 점검을 통과시키기 위해 검사 자체를 완화하거나 테스트를 수정하지 마라. 이유: 문제를 숨기는 것이다. 원인을 고쳐라.
- 대화형 로그인을 시도하지 마라. 이유: 헤드리스 세션이다. 인증이 없으면 `blocked`가 정답이다.
