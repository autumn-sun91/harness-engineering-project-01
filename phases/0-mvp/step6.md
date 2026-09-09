# Step 6: auth-flow

## 읽어야 할 파일

- `/docs/USER_JOURNEY.md` — 1절 전체 여정 플로우차트, OAuth 실패·세션 만료 엣지 케이스
- `/docs/ARCHITECTURE.md` — 디렉토리 구조, 읽기/쓰기 클라이언트 분리 규칙
- `/docs/ADR.md` — ADR-005(Google OAuth 단일 로그인)
- `/src/services/` — step 5의 Supabase 클라이언트 팩토리
- `/src/app/page.tsx` — step 0의 목업 랜딩(로그인 버튼을 연결해야 한다)

## 작업

Supabase Auth 기반 Google OAuth 로그인을 구현한다.

1. **`/login` 페이지** — "Google로 로그인" 버튼 하나. 이메일/비밀번호 입력란을 만들지 마라.
   - `?error=` 쿼리로 돌아온 경우 사용자에게 안내를 보여준다(취소/실패 구분).
   - 이미 로그인된 사용자가 접근하면 대시보드로 보낸다.
2. **`/auth/callback`** — Supabase가 돌려준 code를 세션으로 교환하고 대시보드로 리다이렉트한다. 교환 실패 시 `/login?error=...`로 보낸다.
3. **미들웨어** — 보호 라우트(대시보드 영역)에 대해 세션을 검증하고 만료 시 갱신을 시도한다. 갱신도 실패하면 `/login`으로 보내되, 원래 가려던 경로를 복귀용으로 전달한다.
4. **오픈 리다이렉트 방어 (필수)** — 복귀 경로는 **`/`로 시작하는 상대 경로만** 허용한다. `//`로 시작하거나 스킴(`http:`, `https:`)이 포함된 값은 거부하고 기본 경로로 보낸다. **이 검증 함수에 대한 테스트를 반드시 작성하라** (`https://evil.com`, `//evil.com`, `/dashboard` 케이스 포함).
5. **로그아웃** — 세션을 종료하고 랜딩으로 보낸다.
6. 랜딩 페이지의 로그인 버튼을 `/login`으로 연결한다.
7. 대시보드 자리표시 페이지를 만든다. 로그인한 사용자만 접근 가능하다는 것만 확인되면 되고, **실제 대시보드 UI는 step 10에서 만든다.**

Google OAuth를 쓰려면 Google Cloud Console에서 발급한 Client ID/Secret이 Supabase Auth에 등록되어 있어야 한다. 등록 여부를 코드로 확인할 수 없으므로, 필요한 설정을 `summary`에 남겨 사용자가 확인할 수 있게 하라.

## Acceptance Criteria

```bash
npm run build
npm test
```

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 리다이렉트 검증 테스트가 외부 URL을 차단하는가?
   - 미들웨어가 보호 라우트를 실제로 막는가?
   - 읽기 경로에서 service role 클라이언트를 쓰고 있지 않은가?
3. Supabase 환경변수나 Google OAuth 설정이 없어 진행할 수 없으면 `"status": "blocked"`와 함께 필요한 설정(Google Cloud OAuth Client ID/Secret을 Supabase Auth에 등록, 리다이렉트 URL)을 `blocked_reason`에 구체적으로 적어라.
4. `phases/0-mvp/index.json`의 step 6을 업데이트한다.

## 금지사항

- 이메일/비밀번호, 매직링크, 다른 소셜 로그인을 추가하지 마라. 이유: ADR-005에서 Google OAuth 단일 수단으로 정했고, 수단이 늘면 계정 병합 문제가 생긴다.
- 대시보드 UI를 만들지 마라. 이유: step 10의 범위다. 여기서는 접근 제어만 검증한다.
- 세션을 `localStorage`에 저장하거나 직접 관리하지 마라. 이유: Supabase의 쿠키 기반 SSR 세션을 그대로 쓴다.
- 복귀 경로를 검증 없이 그대로 `redirect()`에 넘기지 마라. 이유: 오픈 리다이렉트로 피싱에 악용된다.
