# 섬 꾸미기 API (ISLAND) — 프론트 제안, 미확정

공통 규칙은 [common.md](./common.md) 참고. 로그인 사용자 전용.

> **노션 명세에 섬 꾸미기 API가 없다**(홈 문서도 "섬꾸미기 데이터 미결정"). 아래는 프론트가 화면(Figma `102:744` "n 섬 꾸미기")을
> 만들며 필요한 최소 형태를 **제안**한 것이다. 백엔드와 합의되면 이 문서를 고치고 `features/island/islandApi.ts`의 mock을 호출로 바꾼다.

## 개념

- 섬 꾸미기 **아이템**(올리브 나무, 벤치 …)을 **양털로 산다**. 양털은 돌봄으로 적립하는 그 양털이다([care-wool.md](./care-wool.md)) — 지금 명세에는 적립·회수만 있고 **소비(구매) 거래가 없다**. 구매는 양털 거래에 소비 타입(예: `SPEND`)이 추가돼야 한다.
- 한 아이템은 한 번만 산다(보유 여부 `owned`). 판매·환불은 없다(1차).
- 범위: 목록, 구매, **섬에 놓인 모습 보여주기**(가진 아이템은 늘 놓여 있고, 안 가진 아이템은 카드를 눌러 하나씩 놓아 볼 수 있다). 놓기를 켜고 끄기·자리 옮기기는 없다.
- 섬에 놓인 모습은 좌표가 아니라 **그림**으로 받는다: 아이템마다 섬 그림과 같은 크기(정사각형)의 투명 그림 한 장(`placedImageUrl`). 프론트는 섬 그림 위에 `placedOrder` 순서로 겹치기만 한다. 자리·크기·그림자가 그림 안에 있어서 아이템을 추가할 때 프론트 수정이 없다.

```ts
type IslandItemCategory = 'PLANT' | 'PATH' | 'FURNITURE' | 'LIGHT' | 'PROP'
// 화면 칩: 식물 · 길과 바닥 · 가구 · 조명 · 소품 (+ 전체)

type IslandItem = {
  itemId: string
  name: string                  // 예: 올리브 나무
  category: IslandItemCategory
  price: number                 // 양털 개수, 1 이상
  imageUrl: string | null       // 목록 카드 그림(정사각, 표시 121px → 242px 이상 권장)
  placedImageUrl: string | null // 섬에 놓인 모습: 섬 그림과 같은 크기의 투명 그림(표시 345px → 690px 권장). 없으면 놓아 보일 수 없음
  placedOrder: number           // 섬 위에서 겹치는 순서, 작은 값이 아래
  owned: boolean                // 내가 이미 샀는지
}
```

## 1. 아이템 목록 조회 (제안)

`GET /api/v1/island/items` · 200

섬 꾸미기 화면 진입 시 한 번 호출. 아이템과 **현재 양털 잔액**을 함께 준다(화면 머리의 "내 양털"과 구매 가능 판단에 씀 — 잔액을 따로 부르지 않으려고).

Response `data`

```ts
{
  woolBalance: number           // 사용 가능한 양털
  items: IslandItem[]           // 표시 순서대로. 분류 필터는 클라이언트가 함
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공. 아이템이 없으면 `items: []` |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

## 2. 아이템 구매 (제안)

`POST /api/v1/island/items/{itemId}/purchases` · 201

양털 `price`개를 쓰고 아이템을 보유 상태로 만든다. 본문 없음.

- **`Idempotency-Key: {UUID}` 헤더 필수**(제안) — 양털을 쓰는 쓰기라 재전송으로 두 번 차감되면 안 된다. 규칙은 [care-wool.md](./care-wool.md)의 Idempotency-Key와 같다(같은 동작 재전송은 같은 키, 같은 키 재시도는 최초 응답 그대로). 프론트는 `api.post(..., { idempotencyKey })`로 보낸다(`src/shared/api`).

Response `data`

```ts
{
  item: IslandItem              // 산 뒤의 아이템(owned: true)
  woolBalance: number           // 산 뒤 남은 양털
}
```

| HTTP | 코드 | 의미 | 프론트 처리 |
| --- | --- | --- | --- |
| 201 | - | 구매 완료 | 잔액·보유를 바로 반영하고 목록 재조회 |
| 404 | ISLAND_ITEM_NOT_FOUND (제안) | 없는·판매 중지된 아이템 | "지금은 살 수 없는 아이템이에요", 목록 재조회 |
| 409 | ISLAND_ITEM_ALREADY_OWNED (제안) | 이미 보유 | **성공으로 취급**, 목록 재조회 |
| 409 | WOOL_BALANCE_INSUFFICIENT | 잔액 부족(care-wool의 기존 코드 재사용) | "양털이 N개 더 필요해요", 목록 재조회 |
| 409 | COMMON_IDEMPOTENCY_CONFLICT | 같은 키로 다른 요청·처리 중 | 오류 안내 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 | 공통 처리 |

## 미결정

- 아이템 목록·가격·분류의 원본(서버 고정 데이터인지 관리 화면이 있는지). 프론트 mock은 시안 카드 12종·값(12/24)과 이름으로 임의 배정한 분류를 쓴다.
- 양털 거래에 소비 타입 추가와 `양털 변동 내역`에 구매가 어떻게 보일지.
- 놓인 그림 12장은 지금 프론트가 카드 그림을 섬 위에 얹어 만든 것(`src/assets/images/island-items/placed/`)이다. 자리는 임의로 정했다 — 디자이너 확인 후 서버 그림으로 교체.
- 놓기 켜기/끄기·자리 옮기기, 홈의 섬에도 반영할지(`GET /home`에 포함 여부).
