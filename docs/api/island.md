# 섬 꾸미기 API (ISLAND)

공통 규칙은 [common.md](./common.md) 참고. 로그인 사용자 전용(토큰 없으면 401).

> 백엔드 `IslandController`·`IslandService`·`V11__create_island_items.sql` 기준(2026-11-20, 백엔드 develop `28fcf78`).
> 노션 명세에는 없다. 프론트 제안 형태(2026-11-15)를 백엔드가 거의 그대로 받았다.

## 개념

- 섬 꾸미기 **아이템**을 **양털로 산다**. 돌봄으로 적립한 그 양털이다([care-wool.md](./care-wool.md)). 구매하면 양털 거래 `SPEND`(음수)가 남는다.
- 한 아이템은 한 번만 산다(`owned`, DB `UNIQUE(user_id, item_id)`). 판매·환불·놓기 끄기·자리 옮기기는 없다.
- 아이템은 서버 고정 데이터(V11 시드, ID를 직접 지정). 관리 화면 없음. `active=false`면 목록에서 빠지고 구매는 404.
- 섬에 놓인 모습은 좌표가 아니라 **그림**: 아이템마다 섬 그림과 같은 크기의 투명 그림(`placedImageUrl`)을 `placedOrder` 순서로 겹친다.
  **서버는 그림 주소를 아직 `null`로 준다** — 프론트가 `itemId`로 자기 그림을 채운다(`features/island/islandApi.ts`, 서버 값이 있으면 서버 값 우선).

```ts
type IslandItemCategory = 'PLANT' | 'PATH' | 'FURNITURE' | 'LIGHT' | 'PROP' // DB CHECK 제약
// 화면 칩: 식물 · 길과 바닥 · 가구 · 조명 · 소품 (+ 전체)

type IslandItem = {
  itemId: string                // "1"
  name: string                  // 최대 50자
  category: IslandItemCategory
  price: number                 // 양털 개수, 1 이상
  imageUrl: string | null       // 지금은 늘 null
  placedImageUrl: string | null // 지금은 늘 null
  placedOrder: number           // 섬 위에서 겹치는 순서, 작은 값이 아래
  floatAt: { x: number; y: number } | null // 물에 뜬 아이템(나룻배)의 흔들림 중심(섬 그림 %), 아니면 null
  owned: boolean                // 내가 이미 샀는지
}
```

### 시드(V11)

| itemId | name | category | price | placedOrder | floatAt | displayOrder |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 올리브 나무 | PLANT | 12 | 2 | null | 1 |
| 2 | 꽃 화분 | PLANT | 24 | 7 | null | 2 |
| 7 | 랜턴 | LIGHT | 12 | 11 | null | 7 |
| 9 | 치즈 선반 | FURNITURE | 12 | 5 | null | 9 |
| 10 | 우편함 | PROP | 24 | 8 | null | 10 |
| 11 | 나룻배 | PROP | 12 | 12 | {65.5, 85} | 11 |
| 12 | 러그 | PATH | 24 | 1 | null | 12 |

`itemId`는 프론트 그림 번호(`src/assets/images/island-items/01~12`)와 같다. 3·4·5·6·8(디딤돌·울타리·벤치·해먹·먹이통)은 시드에 없다.

## 1. 아이템 목록 조회

`GET /api/v1/island/items` · 200 · `Cache-Control: no-store`

활성 아이템(displayOrder, id 순)과 **현재 양털 잔액**. 지갑이 없으면 `woolBalance: 0`(지갑을 만들지 않는다).

Response `data`

```ts
{
  woolBalance: number
  items: IslandItem[]
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공. 아이템이 없으면 `items: []` |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |

## 2. 아이템 구매

`POST /api/v1/island/items/{itemId}/purchases` · 201 · 본문 없음(보내면 400, `{}`도 400)

- **`Idempotency-Key: {UUID}` 헤더 필수**(없거나 UUID가 아니면 400). 같은 키 재요청은 처음 응답(201 본문)을 그대로 돌려주고 양털은 한 번만 깎인다. 같은 키·다른 아이템은 409 `COMMON_IDEMPOTENCY_CONFLICT`. 실패(4xx) 응답은 키를 저장하지 않는다.
- 사용자 행을 잠가 같은 사용자의 구매·돌봄 양털 변경을 직렬화한다 — 동시에 사도 잔액이 음수가 되지 않는다.
- 성공하면 `wool_transactions`에 `SPEND`(amount = −price, `careCompletionId` null), `island_purchases`에 구매 기록, 지갑 잔액 차감.
- 확인 순서: 아이템 없음/비활성(404) → 이미 보유(409) → 잔액 부족(409).

Response `data`

```ts
{
  item: IslandItem              // 산 뒤의 아이템(owned: true)
  woolBalance: number           // 산 뒤 남은 양털
}
```

| HTTP | 코드 | 의미 | 프론트 처리 |
| --- | --- | --- | --- |
| 201 | - | 구매 완료 | 잔액·보유를 바로 반영, 목록 재조회. 홈 요약·양털 잔액·양털 내역은 공통 규칙으로 재조회 |
| 400 | COMMON_INVALID_REQUEST | 본문 있음, 키 없음·형식 오류, itemId가 양의 정수 아님 | 오류 안내 |
| 404 | ISLAND_ITEM_NOT_FOUND | 없는·비활성 아이템 | "지금은 살 수 없는 아이템이에요", 목록 재조회 |
| 409 | ISLAND_ITEM_ALREADY_OWNED | 이미 보유(동시 구매에서 진 요청 포함) | **성공으로 취급**, 목록 재조회 |
| 409 | WOOL_BALANCE_INSUFFICIENT | 잔액 부족(지갑 없음 포함) | "양털이 N개 더 필요해요", 목록 재조회 |
| 409 | COMMON_IDEMPOTENCY_CONFLICT | 같은 키로 다른 아이템 | 오류 안내, 다음 시도는 새 키 |
| 409 | COMMON_STATE_CONFLICT | 같은 키 요청이 처리 중 | 오류 안내, 다음 시도는 **같은 키** |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 | 공통 처리 |

프론트 키 규칙: 서버가 처리했는지 모르는 실패(응답 없음·시간 초과·5xx·408·`COMMON_STATE_CONFLICT`, `isOutcomeUnknown`) 뒤 같은 아이템을 다시 사면 같은 키, 그 밖에는 새 키(`usePurchaseIslandItem`).

## 미결정

- 그림 주소(`imageUrl`·`placedImageUrl`)를 서버가 줄지 — 주면 프론트는 서버 값을 우선한다. 다른 출처 그림이면 CORS 허용이 있어야 홈 양이 가구 뒤로 숨는 기준(발 위치)을 잴 수 있다.
- 양털 내역(`GET /wool-transactions`)의 `SPEND`에 산 아이템이 없다 — 프론트는 "섬 꾸미기 구매"로만 보여준다.
- 홈의 섬에 산 가구를 보이려고 홈에서도 `GET /island/items`를 부른다 — `GET /home`에 넣을지는 미결정.
