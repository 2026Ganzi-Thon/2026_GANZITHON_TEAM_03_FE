import { ApiError } from '@/shared/api'
import { mockDb, mockDelay } from '@/shared/mock'
import oliveTree from '@/assets/images/island-items/01-olive-tree.webp'
import flowerPot from '@/assets/images/island-items/02-flower-pot.webp'
// import steppingStones from '@/assets/images/island-items/03-stepping-stones.webp'
// import fence from '@/assets/images/island-items/04-fence.webp'
// import bench from '@/assets/images/island-items/05-bench.webp'
// import hammock from '@/assets/images/island-items/06-hammock.webp'
import lantern from '@/assets/images/island-items/07-lantern.webp'
// import feedingTrough from '@/assets/images/island-items/08-feeding-trough.webp'
import cheeseShelf from '@/assets/images/island-items/09-cheese-shelf.webp'
import mailbox from '@/assets/images/island-items/10-mailbox.webp'
import rowboat from '@/assets/images/island-items/11-rowboat.webp'
import rug from '@/assets/images/island-items/12-rug.webp'
import oliveTreePlaced from '@/assets/images/island-items/placed/01-olive-tree.webp'
import flowerPotPlaced from '@/assets/images/island-items/placed/02-flower-pot.webp'
import lanternPlaced from '@/assets/images/island-items/placed/07-lantern.webp'
import cheeseShelfPlaced from '@/assets/images/island-items/placed/09-cheese-shelf.webp'
import mailboxPlaced from '@/assets/images/island-items/placed/10-mailbox.webp'
import rowboatPlaced from '@/assets/images/island-items/placed/11-rowboat.webp'
import rugPlaced from '@/assets/images/island-items/placed/12-rug.webp'
import type { IslandItem, IslandItemCategory, IslandItemsResponse, PurchaseIslandItemResponse } from './types'

// TODO(API 연결): 섬 꾸미기 API 는 아직 없다. 형태는 프론트 제안(docs/api/island.md)이고, 확정되면 아래 두 함수의 본문만
// 호출로 바꾼다. mock 상수·`@/shared/mock` import·그림 import 는 함께 지운다(그림은 서버 imageUrl·placedImageUrl 로 온다).
//   fetchIslandItems:   return api.get<IslandItemsResponse>('/island/items')
//   purchaseIslandItem: return api.post<PurchaseIslandItemResponse>(`/island/items/${itemId}/purchases`, undefined, { idempotencyKey })
// (api 는 `@/shared/api`. 구매는 양털을 쓰는 쓰기라 `Idempotency-Key` 가 필요하다 — 같은 구매를 다시 보낼 때 같은 키를 쓰도록
//  usePurchaseIslandItem 이 한 번의 구매 시도마다 `newIdempotencyKey()` 로 키를 만들어 넘긴다. 오류는 ApiError code 로 온다:
//  ISLAND_ITEM_NOT_FOUND 404, ISLAND_ITEM_ALREADY_OWNED 409, WOOL_BALANCE_INSUFFICIENT 409 — 모두 제안 코드.)

export const ISLAND_ITEM_NOT_FOUND = 'ISLAND_ITEM_NOT_FOUND'
export const ISLAND_ITEM_ALREADY_OWNED = 'ISLAND_ITEM_ALREADY_OWNED'
/** docs/api/care-wool.md 에 이미 있는 코드를 같이 쓴다 */
export const WOOL_BALANCE_INSUFFICIENT = 'WOOL_BALANCE_INSUFFICIENT'

function mock(
  itemId: string,
  name: string,
  category: IslandItemCategory,
  price: number,
  imageUrl: string,
  placedImageUrl: string,
  placedOrder: number,
  floatAt: IslandItem['floatAt'] = null,
): IslandItem {
  return { itemId, name, category, price, imageUrl, placedImageUrl, placedOrder, floatAt, owned: false }
}

// 아이템 목록(상수). 보유 여부와 양털은 가짜 DB(`@/shared/mock`, localStorage 저장)에 있어 새로고침해도 남는다. 이름·값은 시안 카드(109:280~) 그대로 — 그림 파일 번호(01~12)와 같은 순서.
// 임의 결정(확인 필요): 분류 배정은 이름으로 정함 — 시안·명세에 없음
// 섬에 놓이는 자리·크기·겹치는 순서(마지막 인자)는 담당자가 배치 도구로 직접 놓은 값이다(2026-11-15). 놓인 그림(placed/*.webp)은
// 카드 그림을 섬 그림 위 그 자리에 얹어 만든 투명 레이어다(그림자·동굴 안 색·물에 잠긴 부분은 임의로 넣음).
// 주석 처리한 5종(디딤돌·울타리·벤치·해먹·먹이통)은 자리를 아직 정하지 않아 목록에서 뺐다 — 사용자 요청.
// 되살릴 때: 자리를 정해 placed/ 에 놓인 그림을 만들고, 위의 카드 그림 import 주석과 함께 푼 뒤 `…Placed` import 를 더한다.
const mockItems: IslandItem[] = [
  mock('1', '올리브 나무', 'PLANT', 12, oliveTree, oliveTreePlaced, 2),
  mock('2', '꽃 화분', 'PLANT', 24, flowerPot, flowerPotPlaced, 7),
  // mock('3', '디딤돌', 'PATH', 12, steppingStones, steppingStonesPlaced, 0),
  // mock('4', '울타리', 'PROP', 24, fence, fencePlaced, 0),
  // mock('5', '벤치', 'FURNITURE', 12, bench, benchPlaced, 0),
  // mock('6', '해먹', 'FURNITURE', 24, hammock, hammockPlaced, 0),
  mock('7', '랜턴', 'LIGHT', 12, lantern, lanternPlaced, 11),
  // mock('8', '먹이통', 'PROP', 24, feedingTrough, feedingTroughPlaced, 0),
  mock('9', '치즈 선반', 'FURNITURE', 12, cheeseShelf, cheeseShelfPlaced, 5),
  mock('10', '우편함', 'PROP', 24, mailbox, mailboxPlaced, 8),
  // 나룻배는 물에 떠 있다 — 흔들림 중심은 놓인 그림에서 배의 한가운데쯤
  mock('11', '나룻배', 'PROP', 12, rowboat, rowboatPlaced, 12, { x: 65.5, y: 85 }),
  mock('12', '러그', 'PATH', 24, rug, rugPlaced, 1),
]

/** 목록 상수에 가짜 DB 의 보유 여부를 합친다 */
function withOwned(item: IslandItem, ownedIds: string[]): IslandItem {
  return { ...item, owned: ownedIds.includes(item.itemId) }
}

/** 아이템 목록과 양털 잔액. `GET /api/v1/island/items` 의 `data` (제안). */
export async function fetchIslandItems(): Promise<IslandItemsResponse> {
  await mockDelay()
  const ownedIds = mockDb.island.ownedItemIds()
  return { woolBalance: mockDb.wool.balance().balance, items: mockItems.map((item) => withOwned(item, ownedIds)) }
}

/**
 * 아이템을 산다. `POST /api/v1/island/items/{itemId}/purchases` (제안, `Idempotency-Key` 필요).
 * 이미 가졌으면 409 ISLAND_ITEM_ALREADY_OWNED, 양털이 모자라면 409 WOOL_BALANCE_INSUFFICIENT 를 흉내 낸다.
 */
export async function purchaseIslandItem(itemId: string, idempotencyKey: string): Promise<PurchaseIslandItemResponse> {
  void idempotencyKey // mock 은 키를 쓰지 않는다 — 실제 호출에서 헤더로 보낸다
  await mockDelay()
  const item = mockItems.find((candidate) => candidate.itemId === itemId)
  if (!item) throw new ApiError(404, { code: ISLAND_ITEM_NOT_FOUND, message: '없는 아이템이에요.' })
  if (mockDb.island.ownedItemIds().includes(itemId)) {
    throw new ApiError(409, { code: ISLAND_ITEM_ALREADY_OWNED, message: '이미 가진 아이템이에요.' })
  }
  // 양털은 가짜 DB 하나에서 깎는다 — 모자라면 409 WOOL_BALANCE_INSUFFICIENT(ApiError)를 던진다. 홈·다른 화면도 같은 잔액을 본다
  const woolBalance = mockDb.wool.spend(item.price)
  mockDb.island.addOwnedItem(itemId)
  return { item: { ...item, owned: true }, woolBalance }
}
