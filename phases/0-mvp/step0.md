# Step 0: project-setup

## 읽어야 할 파일

- `/docs/ARCHITECTURE.md` — 디렉토리 구조와 패턴
- `/docs/ADR.md` — 기술 선택의 배경
- `/CLAUDE.md` — 기술 스택과 CRITICAL 규칙
- `/.gitignore` — 이미 Next.js 산출물과 `.env`를 제외하도록 설정되어 있다
- `/.env` — 환경변수 키 목록이 이미 정의되어 있다 (값은 비어 있음)

## 작업

이 저장소는 **비어 있지 않다**. `docs/`, `scripts/`, `phases/`, `plan.md`, `CLAUDE.md`, `.env`, `.gitignore`가 이미 존재하며 **이 파일들을 절대 덮어쓰거나 삭제하지 마라**. `npx create-next-app`이 기존 파일 때문에 거부하면, 임시 디렉토리에 생성한 뒤 필요한 파일만 옮기거나 수동으로 스캐폴딩하라.

Next.js 15 프로젝트를 초기화한다.

1. **Next.js 15 + App Router + TypeScript strict mode + Tailwind CSS** 설치 및 설정
   - `tsconfig.json`에 `"strict": true`
   - src 디렉토리 사용 (`src/app/...`)
2. **Vitest** 설정 — `npm test`가 동작해야 한다
   - Vitest는 테스트 파일이 하나도 없으면 실패하므로, 스모크 테스트를 최소 1개 작성하라
3. `/docs/ARCHITECTURE.md`의 디렉토리 구조대로 빈 디렉토리 골격을 만든다 (`src/components/`, `src/types/`, `src/lib/`, `src/services/`). 빈 디렉토리는 git에 남지 않으므로 각 디렉토리에 `.gitkeep`을 두어라.
4. **`.env.example` 생성** — `/.env`와 **동일한 키 목록**을 값 없이 복사한다. `.env` 파일 자체는 절대 수정하지 마라.
5. **목업 랜딩 페이지** — `src/app/page.tsx`에 제품명과 한 줄 소개, "로그인" 버튼(아직 동작 안 함) 정도의 최소 화면. `/docs/DESIGN.md`를 따른다 — 흰 캔버스, 무채색, 포인트 컬러 `#0052ff` 하나. **이 step에서는 다른 화면을 만들지 마라.**
6. `package.json`의 scripts에 `dev`, `build`, `lint`, `test`, `eval`이 모두 있어야 한다.
   - `eval`은 step 7에서 실제 Anthropic API를 호출해 분류 품질을 재는 경로다. 이 step에서는 `"eval": "vitest run --passWithNoTests --config vitest.eval.config.ts"`처럼 **자리만 잡아두고**(대상 파일이 없어도 통과하도록) 실제 평가는 step 7에서 채운다.
   - `test`와 `eval`을 반드시 분리하라. 이유: Stop 훅이 매 턴 `npm test`를 실행하므로, 여기에 실제 API 호출이 섞이면 파일을 고칠 때마다 비용이 나가고 모델 출력이 비결정적이라 무관한 커밋에서 실패한다.

## Acceptance Criteria

```bash
npm run build
npm test
npm run lint
```

## 검증 절차

1. 위 AC 커맨드를 모두 실행해 통과하는지 확인한다.
2. 아키텍처 체크리스트:
   - `docs/ARCHITECTURE.md`의 디렉토리 구조를 따르는가?
   - TypeScript strict mode가 켜져 있는가?
   - `docs/` `scripts/` `phases/` `plan.md` `CLAUDE.md` `.env` `.gitignore`가 손상되지 않았는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 0을 업데이트한다.
   - 성공 → `"status": "completed"`, `"summary"`에 생성된 주요 파일 경로와 설정을 한 줄 요약
   - 3회 시도 후 실패 → `"status": "error"` + `"error_message"`

## 금지사항

- 기존 파일(`docs/`, `scripts/`, `phases/`, `plan.md`, `CLAUDE.md`, `.env`, `.gitignore`)을 덮어쓰거나 삭제하지 마라. 이유: 프로젝트 설계 문서와 실행 하네스가 들어 있어 복구할 수 없다.
- `.env`에 값을 채우거나 새 키를 추가하지 마라. 이유: 시크릿은 사용자가 직접 관리한다.
- 랜딩 페이지 외의 화면, 라우트, API를 만들지 마라. 이유: 이후 step에서 다룬다.
- 상태 관리 라이브러리, UI 컴포넌트 라이브러리, ORM 등 추가 의존성을 넣지 마라. 이유: 프로토타입에 불필요하다.
