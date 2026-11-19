import { api } from '@/shared/api'
import oliveTree from '@/assets/images/island-items/01-olive-tree.webp'
import flowerPot from '@/assets/images/island-items/02-flower-pot.webp'
import steppingStones from '@/assets/images/island-items/03-stepping-stones.webp'
import fence from '@/assets/images/island-items/04-fence.webp'
import bench from '@/assets/images/island-items/05-bench.webp'
import hammock from '@/assets/images/island-items/06-hammock.webp'
import lantern from '@/assets/images/island-items/07-lantern.webp'
import feedingTrough from '@/assets/images/island-items/08-feeding-trough.webp'
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
import type { IslandItem, IslandItemsResponse, PurchaseIslandItemResponse } from './types'

// 섬 꾸미기 API. 응답·오류 코드는 백엔드 IslandController·IslandService(V11__create_island_items.sql) 기준 — docs/api/island.md.
// 아이템 목록·값·분류·겹침 순서·물에 뜬 자리(floatAt)·보유·잔액은 서버 값을 그대로 쓰고, 그림만 프론트가 채운다.

/** 구매: 없거나 판매 중지된 아이템(404) */
export const ISLAND_ITEM_NOT_FOUND = 'ISLAND_ITEM_NOT_FOUND'
/** 구매: 이미 가진 아이템(409) */
export const ISLAND_ITEM_ALREADY_OWNED = 'ISLAND_ITEM_ALREADY_OWNED'
/** 구매: 양털 부족(409) — 지갑이 없어도 이 코드. 양털은 깎이지 않는다 */
export const WOOL_BALANCE_INSUFFICIENT = 'WOOL_BALANCE_INSUFFICIENT'

/**
 * 서버 itemId → 프론트에 있는 그림. 서버는 그림 주소(imageUrl·placedImageUrl)를 아직 null 로 준다(IslandItemResponse).
 * 카드 그림 번호(01~12)가 서버 itemId 와 같다(V11 시드: 1·2·7·9·10·11·12). 놓인 그림(placed/)은 담당자가 자리를 정한 7종만 있다 —
 * 나머지(3 디딤돌·4 울타리·5 벤치·6 해먹·8 먹이통)는 서버가 팔기 시작하면 카드는 보이고 섬에는 놓이지 않는다(placedImageUrl null).
 */
const LOCAL_IMAGES: Record<string, { imageUrl: string; placedImageUrl: string | null }> = {
  '1': { imageUrl: oliveTree, placedImageUrl: oliveTreePlaced },
  '2': { imageUrl: flowerPot, placedImageUrl: flowerPotPlaced },
  '3': { imageUrl: steppingStones, placedImageUrl: null },
  '4': { imageUrl: fence, placedImageUrl: null },
  '5': { imageUrl: bench, placedImageUrl: null },
  '6': { imageUrl: hammock, placedImageUrl: null },
  '7': { imageUrl: lantern, placedImageUrl: lanternPlaced },
  '8': { imageUrl: feedingTrough, placedImageUrl: null },
  '9': { imageUrl: cheeseShelf, placedImageUrl: cheeseShelfPlaced },
  '10': { imageUrl: mailbox, placedImageUrl: mailboxPlaced },
  '11': { imageUrl: rowboat, placedImageUrl: rowboatPlaced },
  '12': { imageUrl: rug, placedImageUrl: rugPlaced },
}

/**
 * 서버 아이템에 그림을 채운다.
 * 임의 결정(확인 필요): 서버가 그림 주소를 주면 그걸 우선한다(관리 쪽에서 그림을 바꿀 수 있게). 다만 다른 출처 그림은 CORS 가 없으면
 * 홈 양이 가구 뒤로 숨는 기준(발 위치)을 잴 수 없어, 그 가구는 양을 가리지 않는다(docs/decisions.md 2026-11-19 홈 섬의 양).
 */
function withImages(item: IslandItem): IslandItem {
  const local = LOCAL_IMAGES[item.itemId]
  return {
    ...item,
    imageUrl: item.imageUrl ?? local?.imageUrl ?? null,
    placedImageUrl: item.placedImageUrl ?? local?.placedImageUrl ?? null,
  }
}

/**
 * 활성 아이템(표시 순서)과 내 양털 잔액. 지갑이 없으면 잔액 0(지갑을 만들지 않는다). `GET /api/v1/island/items` 의 `data`.
 */
export async function fetchIslandItems(): Promise<IslandItemsResponse> {
  const data = await api.get<IslandItemsResponse>('/island/items')
  return { woolBalance: data.woolBalance, items: data.items.map(withImages) }
}

/**
 * 아이템을 산다(201). 양털을 값만큼 쓰고(양털 내역에 SPEND) 보유로 바꾼다. 본문 없음(보내면 400).
 * `Idempotency-Key`(UUID) 필수 — 같은 키 재요청은 처음 응답을 그대로, 같은 키·다른 아이템은 409 COMMON_IDEMPOTENCY_CONFLICT.
 * 오류: 404 ISLAND_ITEM_NOT_FOUND, 409 ISLAND_ITEM_ALREADY_OWNED·WOOL_BALANCE_INSUFFICIENT·COMMON_STATE_CONFLICT, 400 COMMON_INVALID_REQUEST.
 * `POST /api/v1/island/items/{itemId}/purchases`.
 */
export async function purchaseIslandItem(itemId: string, idempotencyKey: string): Promise<PurchaseIslandItemResponse> {
  const data = await api.post<PurchaseIslandItemResponse>(
    `/island/items/${encodeURIComponent(itemId)}/purchases`,
    undefined,
    { idempotencyKey },
  )
  return { woolBalance: data.woolBalance, item: withImages(data.item) }
}
