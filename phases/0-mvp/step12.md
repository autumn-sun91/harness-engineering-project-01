# Step 12: account-settings

## 읽어야 할 파일

- `/docs/USER_JOURNEY.md` — 4절 해지 여정, 5절 계정 삭제·다운그레이드
- `/docs/ARCHITECTURE.md` — service role 사용 규칙, 보안 경계
- `/src/services/` — Supabase 클라이언트, Storage 래퍼(step 5), Polar 클라이언트(step 11)
- `/src/app/api/polar/` — step 11의 포털·구독 상태 처리

## 작업

`/settings` 화면과 계정 삭제를 구현한다.

1. **설정 화면**
   - 현재 플랜과 상태를 보여준다(Free / Pro / 해지 예약 시 종료 예정일).
   - Pro 사용자에게는 Polar 고객 포털 링크(step 11의 `/api/polar/portal`)를 노출한다. 자체 해지 UI를 만들지 마라.
   - Free 사용자에게는 업그레이드 CTA를 노출한다.
   - 로그아웃 버튼.
2. **`POST /api/account/delete`** — 순서를 지켜라:
   1. 세션 검증 후 **본인 계정인지 확인**한다.
   2. 활성 Polar 구독이 있으면 취소한다.
   3. Storage의 **암호화된 원본 CSV를 모두 삭제**한다(step 5의 삭제 함수 사용).
   4. `analysis_results` → `transactions` → `csv_uploads` → `subscriptions` 순으로 DB 행을 삭제한다.
   5. Supabase Auth 사용자를 삭제한다.
   6. 세션을 종료하고 랜딩으로 보낸다.
   - 이 경로는 service role 클라이언트를 쓰므로 **RLS가 적용되지 않는다. 모든 삭제 쿼리에 대상 user_id 조건을 명시적으로 넣어라.** 조건이 빠지면 전체 사용자 데이터가 지워진다.
3. **삭제 확인 UI** — 되돌릴 수 없다는 경고와 함께 사용자가 확인 문구를 입력하게 한다. 클릭 한 번으로 삭제되지 않게 하라.

## Acceptance Criteria

```bash
npm run build
npm test
```

테스트는 최소한 다음을 포함해야 한다: 미인증 삭제 요청 거부, 삭제 쿼리에 user_id 조건이 포함되는지, 타 사용자 데이터가 영향을 받지 않는지, 구독 취소가 DB 삭제보다 먼저 수행되는지.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - service role 사용 경로의 모든 쿼리에 user_id 조건이 있는가?
   - Storage 원본 삭제가 누락되지 않았는가?
   - 삭제 전 확인 단계가 있는가?
3. `phases/0-mvp/index.json`의 step 12를 업데이트한다.

## 금지사항

- user_id 조건 없는 delete 쿼리를 작성하지 마라. 이유: service role은 RLS를 우회하므로 전체 테이블이 지워질 수 있다.
- soft delete(플래그만 세우기)로 대체하지 마라. 이유: 삭제 요청은 실제 삭제로 처리하기로 했다.
- 자체 해지·환불 로직을 구현하지 마라. 이유: Polar 고객 포털에 위임한다.
- 관리자 화면이나 사용자 목록 기능을 만들지 마라. 이유: MVP 범위 밖이며 권한 모델이 필요해진다.
