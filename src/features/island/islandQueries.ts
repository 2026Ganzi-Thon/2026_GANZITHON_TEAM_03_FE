import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { fetchIslandItems } from './islandApi'
import type { IslandItemsResponse, PurchaseIslandItemResponse } from './types'

export const islandKeys = {
  all: ['island'] as const,
  items: () => [...islandKeys.all, 'items'] as const,
}

/**
 * 아이템 목록 + 양털 잔액. 양털은 다른 화면(돌봄 등)에서 바뀌므로 들어올 때마다 뒤에서 새로 받는다(staleTime 0, 홈과 같음).
 * 캐시가 있으면 스켈레톤 없이 바로 보인다.
 */
export const islandItemsQueryOptions = () =>
  queryOptions({
    queryKey: islandKeys.items(),
    queryFn: fetchIslandItems,
  })

/** 구매 결과를 목록 캐시에 바로 반영한다(잔액, 그 아이템의 보유). 재조회는 쓰는 쪽에서 invalidate 한다. */
export function applyPurchase(queryClient: QueryClient, result: PurchaseIslandItemResponse): void {
  queryClient.setQueryData(islandKeys.items(), (old?: IslandItemsResponse) => {
    if (!old) return old
    return {
      woolBalance: result.woolBalance,
      items: old.items.map((item) => (item.itemId === result.item.itemId ? result.item : item)),
    }
  })
}
