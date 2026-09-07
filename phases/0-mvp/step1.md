# Step 1: deploy-preview

## 읽어야 할 파일

- `/docs/ADR.md` — ADR-013(배포를 구현 초기에 배치), ADR-007(Vercel 제약)
- `/package.json`, `/next.config.*` — step 0에서 생성된 프로젝트 설정
- `/src/app/page.tsx` — 배포 대상인 목업 랜딩 페이지

## 작업

step 0에서 만든 목업 상태 그대로 Vercel **preview** 배포를 수행한다. 기능이 없는 상태에서 먼저 배포해 배포 파이프라인·빌드 설정 문제를 조기에 드러내는 것이 목적이다.

1. **인증 상태를 먼저 확인하라.**
   ```bash
   npx vercel whoami
   ```
   - 인증되어 있지 않거나 `VERCEL_TOKEN` 환경변수가 없으면 **즉시 중단하고 step을 `blocked`로 기록하라.** 이 세션은 헤드리스로 실행되므로 대화형 로그인(`vercel login`)을 수행할 수 없다.
2. 인증되어 있다면 프로젝트를 연결하고 preview 배포한다.
   ```bash
   npx vercel link --yes
   npx vercel deploy
   ```
   - `--prod` 플래그를 쓰지 마라. 이 step은 preview 배포만 수행한다.
3. 배포가 성공하면 출력된 preview URL을 확인하고, 해당 URL이 200을 반환하는지 검증하라.
4. Vercel이 생성한 `.vercel/` 디렉토리가 git에 커밋되지 않도록 `.gitignore`에 `.vercel`을 추가하라.

## Acceptance Criteria

```bash
npm run build
npm test
npx vercel whoami
```

배포 성공 시 preview URL이 출력되고 HTTP 200을 반환해야 한다.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 배포된 preview URL에 접속해 랜딩 페이지가 렌더되는지 확인한다.
3. 결과에 따라 `phases/0-mvp/index.json`의 step 1을 업데이트한다.
   - 성공 → `"status": "completed"`, `"summary"`에 **preview URL과 Vercel 프로젝트명**을 반드시 포함
   - Vercel 인증 없음 → `"status": "blocked"`, `"blocked_reason": "Vercel 인증 필요. 터미널에서 'npx vercel login'을 실행하거나 VERCEL_TOKEN 환경변수를 설정한 뒤 status를 pending으로 되돌리고 재실행하라."` 기록 후 **즉시 중단**
   - 빌드 실패 등 코드 문제 → 3회 시도 후에도 실패 시 `"status": "error"` + `"error_message"`

## 금지사항

- `vercel deploy --prod`를 실행하지 마라. 이유: production 승격은 step 14에서 기능이 완성된 후에 한다.
- 대화형 로그인(`vercel login`)을 시도하지 마라. 이유: 헤드리스 세션이라 입력을 받을 수 없고 타임아웃까지 멈춘다. 인증이 없으면 `blocked` 처리가 정답이다.
- Vercel 대시보드에서 환경변수를 설정하는 작업을 시도하지 마라. 이유: 아직 필요한 시크릿이 없고, step 14에서 일괄 처리한다.
- 배포를 위해 애플리케이션 코드를 수정하지 마라. 이유: 이 step은 배포만 검증한다. 빌드가 깨지면 그것이 이 step이 잡아야 할 문제다.
