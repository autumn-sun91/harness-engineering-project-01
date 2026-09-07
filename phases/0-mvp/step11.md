# Step 11: billing

## 읽어야 할 파일

- `/docs/USER_JOURNEY.md` — 3절 결제 시퀀스 다이어그램 (**이 step의 사양서다**), 5절 결제 엣지 케이스
- `/docs/ARCHITECTURE.md` — API 목록, service role 사용 규칙, 보안 경계
- `/docs/PRD.md` — Pro $9/월
- `/src/types/` — `Subscription` 타입
- `/src/services/` — Supabase 클라이언트 팩토리
- `/.env` — `POLAR_ACCESS_TOKEN`, `POLAR_PRODUCT_ID`, `POLAR_WEBHOOK_SECRET`, `POLAR_SERVER`

## 작업

Polar 구독 결제를 구현한다.

1. **`POST /api/polar/checkout`**
   - **product ID는 서버 환경변수에서만 읽는다. 클라이언트가 보낸 상품·가격·플랜 값을 절대 신뢰하지 마라.**
   - user_id는 서버 세션에서 취득해 Polar 메타데이터로 전달한다.
   - 성공 시 Polar 체크아웃 URL로 리다이렉트한다.
2. **`POST /api/polar/webhook`** — 순서를 지켜라:
   1. **서명 검증** (`POLAR_WEBHOOK_SECRET`). 검증 실패 시 **401을 반환하고 아무것도 변경하지 마라.** 이 검증이 없으면 누구나 요청을 보내 자신을 Pro로 만들 수 있다.
      - **검증은 Polar 공식 SDK의 webhook 검증 유틸리티에 위임하고, HMAC 비교를 직접 구현하지 마라.** 이유: **2026-09-08 00:00 UTC 이후 발급된 시크릿은 Standard Webhooks 규격**을 따르고, 그 이전 시크릿은 Polar 자체 HMAC을 쓴다. 현재 `.env`의 샌드박스 시크릿은 구 방식이고 step 14에서 발급받을 production 시크릿은 신 방식이 되므로, **이 코드는 두 규격을 모두 만난다.** 직접 구현하면 production 전환일에 결제가 조용히 끊긴다.
   2. **멱등성**: `subscriptions.last_event_id`가 방금 받은 이벤트와 같으면 무시한다.
   3. **순서 역전 방어**: 이벤트 타임스탬프가 저장된 `last_event_ts`보다 오래됐으면 무시한다.
   4. 구독 상태를 갱신한다(`plan`, `polar_status`, `cancel_at_period_end`, `current_period_end`, `last_event_id`, `last_event_ts`).
   - webhook 처리는 사용자 세션이 없으므로 service role 클라이언트를 쓰되, **메타데이터의 user_id로 대상 행을 특정**하라.
3. **결제 복귀 처리** — 대시보드가 `?checkout=success`로 진입하면 Server Component에서 **Polar에 구독 상태를 1회 조회해 즉시 반영**한다. webhook은 백업 경로다. 폴링 루프를 만들지 마라.
   - `?checkout=cancelled`면 "업그레이드가 취소되었어요" 배너만 보여주고 상태는 바꾸지 않는다.
4. **`GET /api/polar/portal`** — Polar 고객 포털로 리다이렉트해 해지·결제수단 변경을 맡긴다. 자체 해지 UI를 만들지 마라.
5. **구독 상태 배너** — 해지 예약(`cancel_at_period_end`) 상태면 "현재 결제 주기(날짜)까지 Pro를 이용할 수 있어요"를 보여준다.
6. **유효 플랜 판정 헬퍼 하나** — `plan`, `polar_status`, `cancel_at_period_end`, `current_period_end`를 조합해 지금 Pro인지 판정하는 함수를 **한 곳에만** 만들고 모든 곳에서 이를 쓴다. 판정 로직이 여러 곳에 흩어지면 게이팅이 어긋난다.

## Acceptance Criteria

```bash
npm run build
npm test
```

테스트는 최소한 다음을 포함해야 한다: **서명 없는/위조된 webhook이 401이고 구독 상태가 변하지 않음**, 동일 이벤트 재전송 시 중복 처리 안 됨, 오래된 타임스탬프 이벤트가 최신 상태를 덮어쓰지 않음, 해지 예약 상태에서 주기 종료 전까지 Pro로 판정됨.

## 검증 절차

1. 위 AC 커맨드를 실행한다.
2. 체크리스트:
   - 서명 검증이 **모든 처리보다 먼저** 수행되는가?
   - product ID가 서버 환경변수에서만 오는가?
   - 유효 플랜 판정이 단일 헬퍼로 통일됐는가?
3. Polar 계정·제품·webhook 시크릿이 없어 검증이 불가능하면 `"status": "blocked"`와 함께 필요한 설정(Polar 대시보드에서 $9/월 제품 생성, webhook 엔드포인트 등록, 시크릿 발급)을 `blocked_reason`에 구체적으로 적어라.
4. `phases/0-mvp/index.json`의 step 11을 업데이트한다.

## 금지사항

- 서명 검증을 생략하거나 나중으로 미루지 마라. 이유: 검증 없는 webhook은 누구나 호출해 구독을 위조할 수 있는 치명적 취약점이다.
- 서명 검증을 수동 HMAC 비교로 직접 구현하지 마라. 이유: 서명 규격이 2026-09-08을 기점으로 Standard Webhooks로 바뀌어 샌드박스와 production이 서로 다른 방식을 쓴다. SDK 검증기가 두 경우를 모두 처리한다.
- 자체 결제 폼·카드 입력 UI를 만들지 마라. 이유: Polar 호스팅 체크아웃을 쓰기로 했고, 카드 정보를 직접 다루면 PCI 부담이 생긴다.
- 구독 상태를 클라이언트 상태나 쿠키에 캐시하지 마라. 이유: 조작 가능하다. 항상 DB에서 조회한다.
- 결제 복귀 후 폴링 루프를 돌리지 마라. 이유: Polar 1회 조회로 즉시 반영하는 편이 단순하고 빠르다.
