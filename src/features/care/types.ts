// 자기 돌봄·양털(care) 기능 타입. 근거: docs/api/care-wool.md
import type { CareAction, CareCompletion } from '@/shared/types'

export type {
  CancelCareCompletionRequest,
  CancelCareCompletionResponse,
  CareAction,
  CareActionsResponse,
  CareCompletion,
  CompleteCareActionResponse,
  TodayCareCompletionsResponse,
  WoolTransaction,
  WoolTransactionListParams,
  WoolTransactionListResponse,
  WoolTransactionType,
  WoolWallet,
} from '@/shared/types'

/**
 * 오늘의 돌봄 체크리스트 한 줄. 돌봄 행동 목록과 오늘의 완료 내역을 합쳐서 만든다.
 * 체크 여부는 행의 존재가 아니라 `completion.isCompleted`로 판단한다.
 */
export interface CareChecklistItem {
  action: CareAction
  /** 오늘 완료 행이 없으면 null. 취소된 행도 들어올 수 있다(isCompleted: false) */
  completion: CareCompletion | null
}

export type CareChecklistState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: CareChecklistItem[]; balance: number | null }
