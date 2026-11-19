// 섬 꾸미기(island) 기능 타입. 백엔드 IslandItemResponse·IslandItemsResponse·IslandPurchaseResponse 기준 — docs/api/island.md

/** 아이템 분류. 화면의 칩 이름은 `ISLAND_CATEGORIES`(categories.ts) */
export type IslandItemCategory = 'PLANT' | 'PATH' | 'FURNITURE' | 'LIGHT' | 'PROP'

/** 섬 꾸미기 아이템 하나 */
export interface IslandItem {
  itemId: string
  name: string
  category: IslandItemCategory
  /** 구매에 드는 양털 개수 */
  price: number
  /** 목록 카드 그림. 서버는 아직 null 이라 프론트 그림을 itemId 로 채운다(islandApi). 없으면 자리만 둔다 */
  imageUrl: string | null
  /**
   * 섬에 놓인 모습: 섬 그림과 같은 크기(정사각형)의 투명 그림. 섬 그림 위에 그대로 겹치면 제자리에 놓인다
   * (자리·크기·그림자가 그림 안에 들어 있어 좌표가 따로 없다). 없으면 섬에 놓아 보일 수 없는 아이템.
   */
  placedImageUrl: string | null
  /** 섬 위에서 겹치는 순서. 작은 값이 아래(먼저 그린다) */
  placedOrder: number
  /**
   * 물에 떠 있는 아이템이면 떠 있는 자리(섬 그림에서의 %, 흔들림의 중심). 물결에 맞춰 까딱인다. 물에 뜨지 않으면 null
   */
  floatAt: { x: number; y: number } | null
  /** 이미 산 아이템인지 */
  owned: boolean
}

/** `GET /island/items` 의 `data` */
export interface IslandItemsResponse {
  /** 지금 쓸 수 있는 양털. 구매 판단과 머리의 "내 양털"에 쓴다 */
  woolBalance: number
  items: IslandItem[]
}

/** `POST /island/items/{itemId}/purchases` 의 `data` (201) */
export interface PurchaseIslandItemResponse {
  /** 산 뒤의 아이템(`owned: true`) */
  item: IslandItem
  /** 산 뒤 남은 양털 */
  woolBalance: number
}

/** 칩 필터. `ALL` 은 전체 */
export type IslandCategoryFilter = 'ALL' | IslandItemCategory

export type IslandItemsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; woolBalance: number; items: IslandItem[] }

export type PurchaseIslandItemState =
  | { status: 'idle' }
  | { status: 'purchasing' }
  /** 산 아이템. 이미 가진 아이템(409 ISLAND_ITEM_ALREADY_OWNED)도 성공으로 본다 */
  | { status: 'success' }
  /** 서버가 양털이 모자란다고 거절함(409 WOOL_BALANCE_INSUFFICIENT) — 목록을 다시 받는다 */
  | { status: 'insufficient' }
  /** 없는 아이템(404 ISLAND_ITEM_NOT_FOUND) — 목록을 다시 받는다 */
  | { status: 'not-found' }
  | { status: 'error' }
