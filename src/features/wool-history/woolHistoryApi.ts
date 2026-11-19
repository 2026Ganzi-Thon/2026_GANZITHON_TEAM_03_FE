import { api } from '@/shared/api'
import type { WoolTransactionListResponse } from './types'

/** 한 번에 받는 내역 수(서버 기본 20, 1~100) */
export const WOOL_HISTORY_PAGE_SIZE = 20

/**
 * 내 양털 변동 내역 한 페이지(최신순: createdAt 내림차순 → id 내림차순). `GET /api/v1/wool-transactions?page&size`.
 * 응답은 백엔드 CareController·CareService 기준 `{ items, page, size, hasNext }`. 내역이 없으면 items [].
 * 오류: 400 COMMON_INVALID_REQUEST(page < 0, size 1~100 밖·숫자 아님).
 */
export function fetchWoolTransactions(page: number, size = WOOL_HISTORY_PAGE_SIZE): Promise<WoolTransactionListResponse> {
  return api.get<WoolTransactionListResponse>('/wool-transactions', { query: { page, size } })
}
