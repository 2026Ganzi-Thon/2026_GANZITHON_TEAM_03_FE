import { api } from '@/shared/api'
import type {
  CancelCareCompletionResponse,
  CareActionsResponse,
  CompleteCareActionResponse,
  TodayCareCompletionsResponse,
} from './types'

// 돌봄 API. 응답·오류 코드는 백엔드 CareController·CareService 기준(docs/api/care-wool.md 초안과 다른 곳은 코드가 우선).
// 날짜 경계는 서버의 한국 날짜(Asia/Seoul)다.

/** 완료: 이미 오늘 완료 상태(409) */
export const CARE_ALREADY_COMPLETED = 'CARE_ALREADY_COMPLETED'
/** 완료: 비활성 행동(409) */
export const CARE_ACTION_INACTIVE = 'CARE_ACTION_INACTIVE'
/** 완료: 없는 행동(404) */
export const CARE_ACTION_NOT_FOUND = 'CARE_ACTION_NOT_FOUND'
/** 완료: 잔액 상한(int) 초과(409) — 초안에 없고 백엔드 코드에만 있다 */
export const WOOL_BALANCE_LIMIT_EXCEEDED = 'WOOL_BALANCE_LIMIT_EXCEEDED'
/** 취소: 오늘(한국 날짜) 완료가 아님(409) */
export const CARE_CANCEL_DATE_EXPIRED = 'CARE_CANCEL_DATE_EXPIRED'
/** 취소: 이미 취소됨(409) */
export const CARE_ALREADY_CANCELLED = 'CARE_ALREADY_CANCELLED'
/** 취소: 보낸 적립 거래가 지금 회차가 아님(409) */
export const CARE_COMPLETION_CYCLE_CHANGED = 'CARE_COMPLETION_CYCLE_CHANGED'
/** 취소: 회수할 양털보다 잔액이 적음(409) — 양털을 이미 썼을 때 */
export const WOOL_BALANCE_INSUFFICIENT = 'WOOL_BALANCE_INSUFFICIENT'
/** 취소: 내 완료가 아니거나 없음(404) */
export const CARE_COMPLETION_NOT_FOUND = 'CARE_COMPLETION_NOT_FOUND'

/** 활성 돌봄 행동(displayOrder, id 순, 분류 `category` 포함). `GET /api/v1/care-actions` */
export function fetchCareActions(): Promise<CareActionsResponse> {
  return api.get<CareActionsResponse>('/care-actions')
}

/** 오늘(한국 날짜) 완료 내역 — 취소된 행도 isCompleted false 로 들어온다. `GET /api/v1/care-completions/today` */
export function fetchTodayCareCompletions(): Promise<TodayCareCompletionsResponse> {
  return api.get<TodayCareCompletionsResponse>('/care-completions/today')
}

/**
 * 돌봄 완료(양털 적립). `POST /api/v1/care-actions/{careActionId}/completions`, 본문 없음(보내면 400).
 * `Idempotency-Key` 필수(UUID) — 같은 완료 시도를 다시 보낼 때는 같은 키를 쓴다.
 */
export function completeCareAction(careActionId: string, idempotencyKey: string): Promise<CompleteCareActionResponse> {
  return api.post<CompleteCareActionResponse>(
    `/care-actions/${encodeURIComponent(careActionId)}/completions`,
    undefined,
    { idempotencyKey },
  )
}

/**
 * 완료 취소(양털 회수). `POST /api/v1/care-completions/{completionId}/cancel`,
 * 본문 `{ earningTransactionId }`(지금 회차 적립 거래), `Idempotency-Key` 필수.
 */
export function cancelCareCompletion(
  completionId: string,
  earningTransactionId: string,
  idempotencyKey: string,
): Promise<CancelCareCompletionResponse> {
  return api.post<CancelCareCompletionResponse>(
    `/care-completions/${encodeURIComponent(completionId)}/cancel`,
    { earningTransactionId },
    { idempotencyKey },
  )
}
