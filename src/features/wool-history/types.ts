// 양털 변동 내역 기능 타입. 근거: 백엔드 CareService.transactions (docs/api/care-wool.md 6)
import type { WoolTransaction } from '@/shared/types'

export type { WoolTransaction, WoolTransactionListResponse, WoolTransactionType } from '@/shared/types'

/** 서울 날짜 하나에 묶인 내역 */
export interface WoolHistoryDay {
  /** YYYY-MM-DD (Asia/Seoul) */
  date: string
  items: WoolTransaction[]
}

export type WoolHistoryState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'success'
      days: WoolHistoryDay[]
      hasNext: boolean
      /** 다음 페이지를 받는 중 */
      loadingMore: boolean
      /** 다음 페이지를 받지 못함 */
      moreError: boolean
    }
