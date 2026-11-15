import { mockDb, mockDelay } from '@/shared/mock'
import type { WoolWallet } from '@/shared/types'

// TODO(API 연결): 본문만 `return api.get<WoolWallet>('/wool-wallet')` 로 바꾸고 `@/shared/mock` import 를 지운다.
/** 내 양털 잔액. `GET /api/v1/wool-wallet` 의 `data`. 지금은 가짜 DB 값(홈 요약의 woolBalance 와 같은 값). */
export async function fetchWoolWallet(): Promise<WoolWallet> {
  await mockDelay()
  return mockDb.wool.balance()
}
