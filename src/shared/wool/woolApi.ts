import { api } from '@/shared/api'
import type { WoolWallet } from '@/shared/types'

/** 내 양털 잔액. `GET /api/v1/wool-wallet` 의 `data`. 지갑이 없으면 balance 0, updatedAt null(홈 요약의 woolBalance 와 같은 값). */
export function fetchWoolWallet(): Promise<WoolWallet> {
  return api.get<WoolWallet>('/wool-wallet')
}
