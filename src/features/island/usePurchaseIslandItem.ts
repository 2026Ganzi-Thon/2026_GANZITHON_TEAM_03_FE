import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode, isOutcomeUnknown, newIdempotencyKey } from '@/shared/api'
import { woolKeys } from '@/shared/wool'
import type { WoolWallet } from '@/shared/types'
import {
  ISLAND_ITEM_ALREADY_OWNED,
  ISLAND_ITEM_NOT_FOUND,
  WOOL_BALANCE_INSUFFICIENT,
  purchaseIslandItem,
} from './islandApi'
import { applyPurchase, islandKeys } from './islandQueries'
import type { PurchaseIslandItemState } from './types'

/**
 * 아이템을 산다. 성공하면 목록 캐시의 잔액·보유와 양털 잔액 캐시를 바로 바꾸고 뒤에서 목록을 다시 받는다
 * (홈 요약·양털 잔액·양털 내역은 app/queryClient.ts 공통 규칙이 다시 받는다).
 * 이미 가진 아이템(409)은 성공으로 보고, 양털 부족(409)·없는 아이템(404)도 목록을 다시 받아 화면을 서버와 맞춘다.
 *
 * `Idempotency-Key` 는 같은 아이템을 다시 사려는 동안, 서버가 처리했는지 모르는 실패(네트워크·시간 초과·5xx·잠금 충돌) 뒤에만 같은 키를 쓴다 —
 * 서버가 이미 샀으면 처음 응답(201)이 그대로 와서 양털이 두 번 깎이지 않는다. 성공했거나 서버가 처리하지 않은 게 확실한 실패면 키를 버린다.
 */
export function usePurchaseIslandItem() {
  const queryClient = useQueryClient()
  const keyRef = useRef<{ itemId: string; key: string } | null>(null)
  const refresh = () => void queryClient.invalidateQueries({ queryKey: islandKeys.items() })

  const takeKey = (itemId: string) => {
    if (keyRef.current?.itemId !== itemId) keyRef.current = { itemId, key: newIdempotencyKey() }
    return keyRef.current.key
  }

  const mutation = useMutation({
    mutationFn: (itemId: string) => purchaseIslandItem(itemId, takeKey(itemId)),
    onSuccess: (result) => {
      keyRef.current = null
      applyPurchase(queryClient, result)
      queryClient.setQueryData(woolKeys.wallet(), (old?: WoolWallet) => (old ? { ...old, balance: result.woolBalance } : old))
      refresh()
    },
    onError: (error) => {
      if (!isOutcomeUnknown(error)) keyRef.current = null
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
      await mutation.mutateAsync(itemId)
      return true
    } catch (error) {
      return hasErrorCode(error, ISLAND_ITEM_ALREADY_OWNED)
    }
  }

  return { state, purchase, reset: mutation.reset }
}
