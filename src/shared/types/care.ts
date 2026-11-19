// 자기 돌봄·양털 API 타입 - 백엔드 CareController·CareService 기준(초안 docs/api/care-wool.md)
import type { DateString, Id, IsoDateTime, PageParams, Paged } from './common'

export interface CareAction {
  careActionId: Id
  name: string
  description: string | null
  /** 현재 지급량, 0 이상 */
  rewardAmount: number
  displayOrder: number
}

/** 돌봄 행동 목록 조회 응답의 data (활성 행동만, displayOrder 오름차순) */
export interface CareActionsResponse {
  items: CareAction[]
}

export interface CareCompletion {
  completionId: Id
  careActionId: Id
  actionDate: DateString
  /** 지급 당시 서버 기준 지급량, 0 이상 */
  rewardAmount: number
  /** 체크박스는 행 존재 여부가 아니라 이 값으로 표시. 취소 상태는 false */
  isCompleted: boolean
  completedAt: IsoDateTime
  cancelledAt: IsoDateTime | null
  /** 현재 완료 회차의 적립 거래 ID. 취소 상태는 null */
  earningTransactionId: Id | null
}

/** 오늘의 돌봄 완료 내역 조회 응답의 data (취소된 행도 포함) */
export interface TodayCareCompletionsResponse {
  actionDate: DateString
  items: CareCompletion[]
}

/** 돌봄 행동 완료 응답의 data. Idempotency-Key 헤더 필수(백엔드 CareController) */
export interface CompleteCareActionResponse {
  completion: CareCompletion
  /** 반영 직후 지갑 잔액 */
  balance: number
}

/** 돌봄 행동 완료 취소. earningTransactionId는 현재 완료 회차의 적립 거래 ID */
export interface CancelCareCompletionRequest {
  earningTransactionId: Id
}

export interface CancelCareCompletionResponse {
  completion: CareCompletion
  /** 회수 거래 ID */
  reversalTransactionId: Id
  balance: number
}

/** 양털 잔액 조회 응답의 data. 지갑이 없으면 balance 0, updatedAt null */
export interface WoolWallet {
  balance: number
  updatedAt: IsoDateTime | null
}

/** EARN 돌봄 완료 적립 / REVERSE 완료 취소 회수 / SPEND 섬 꾸미기 구매(백엔드 IslandService) */
export type WoolTransactionType = 'EARN' | 'REVERSE' | 'SPEND'

export interface WoolTransaction {
  transactionId: Id
  /** EARN 양수, REVERSE·SPEND 음수 */
  amount: number
  transactionType: WoolTransactionType
  /** 돌봄 거래(EARN·REVERSE)의 완료 ID. SPEND 는 null */
  careCompletionId: Id | null
  /** 회수 대상 원거래 ID. EARN은 null */
  reversesTransactionId: Id | null
  createdAt: IsoDateTime
}

/** 양털 변동 내역 쿼리 (size 기본 20, 1~100) */
export type WoolTransactionListParams = PageParams

export type WoolTransactionListResponse = Paged<WoolTransaction>
