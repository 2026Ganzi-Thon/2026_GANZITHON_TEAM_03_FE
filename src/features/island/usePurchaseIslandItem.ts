import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode, newIdempotencyKey } from '@/shared/api'
import {
  ISLAND_ITEM_ALREADY_OWNED,
  ISLAND_ITEM_NOT_FOUND,
  WOOL_BALANCE_INSUFFICIENT,
  purchaseIslandItem,
} from './islandApi'
import { applyPurchase, islandKeys } from './islandQueries'
import type { PurchaseIslandItemState } from './types'

/**
 * 아이템을 산다. 성공하면 목록 캐시의 잔액·보유를 바로 바꾸고 뒤에서 목록을 다시 받는다.
 * 이미 가진 아이템(409)은 성공으로 보고, 양털 부족(409)·없는 아이템(404)도 목록을 다시 받아 화면을 서버와 맞춘다.
 */
export function usePurchaseIslandItem() {
  const queryClient = useQueryClient()
  const refresh = () => void queryClient.invalidateQueries({ queryKey: islandKeys.items() })

  const mutation = useMutation({
    // 한 번의 구매 시도마다 키를 하나 만든다(재시도 시 같은 키) — 실제 API 연결 때 헤더로 나간다
    mutationFn: ({ itemId, idempotencyKey }: { itemId: string; idempotencyKey: string }) =>
      purchaseIslandItem(itemId, idempotencyKey),
    onSuccess: (result) => {
      applyPurchase(queryClient, result)
      refresh()
    },
    onError: (error) => {
      if (
        hasErrorCode(error, ISLAND_ITEM_ALREADY_OWNED) ||
        hasErrorCode(error, WOOL_BALANCE_INSUFFICIENT) ||
        hasErrorCode(error, ISLAND_ITEM_NOT_FOUND)
      ) {
        refresh()
      }
    },
  })

  const state: PurchaseIslandItemState =
    mutation.status === 'pending'
      ? { status: 'purchasing' }
      : mutation.status === 'success'
        ? { status: 'success' }
        : mutation.status === 'error'
          ? hasErrorCode(mutation.error, ISLAND_ITEM_ALREADY_OWNED)
            ? { status: 'success' }
            : hasErrorCode(mutation.error, WOOL_BALANCE_INSUFFICIENT)
              ? { status: 'insufficient' }
              : hasErrorCode(mutation.error, ISLAND_ITEM_NOT_FOUND)
                ? { status: 'not-found' }
                : { status: 'error' }
          : { status: 'idle' }

  /**
   * 산다. 이미 사는 중이면 무시한다(연타 방지). 샀거나 이미 가진 아이템이면 true — 실패 내용은 `state` 로 본다.
   */
  const purchase = async (itemId: string): Promise<boolean> => {
    if (mutation.isPending) return false
    try {
      await mutation.mutateAsync({ itemId, idempotencyKey: newIdempotencyKey() })
      return true
    } catch (error) {
      return hasErrorCode(error, ISLAND_ITEM_ALREADY_OWNED)
    }
  }

  return { state, purchase, reset: mutation.reset }
}
