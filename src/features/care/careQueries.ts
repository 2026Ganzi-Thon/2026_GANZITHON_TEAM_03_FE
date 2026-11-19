import { useRef } from 'react'
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { hasErrorCode, isApiError, newIdempotencyKey } from '@/shared/api'
import { woolKeys } from '@/shared/wool'
import type { WoolWallet } from '@/shared/types'
import {
  CARE_ACTION_INACTIVE,
  CARE_ACTION_NOT_FOUND,
  CARE_ALREADY_CANCELLED,
  CARE_ALREADY_COMPLETED,
  CARE_CANCEL_DATE_EXPIRED,
  CARE_COMPLETION_CYCLE_CHANGED,
  CARE_COMPLETION_NOT_FOUND,
  cancelCareCompletion,
  completeCareAction,
  fetchCareActions,
  fetchTodayCareCompletions,
} from './careApi'
import type { CareCompletion, TodayCareCompletionsResponse } from './types'

export const careKeys = {
  all: ['care'] as const,
  actions: () => [...careKeys.all, 'actions'] as const,
  today: () => [...careKeys.all, 'today'] as const,
}

/**
 * 돌봄 행동 목록. 운영자가 바꾸는 값이라 자주 바뀌지 않는다 — 5분 동안은 다시 받지 않고,
 * 다시 들어오면 캐시를 바로 보여준다(스켈레톤·깜빡임 없음). 분류 탭은 화면에서 나눈다(한 번만 받는다).
 */
export const careActionsQueryOptions = () =>
  queryOptions({
    queryKey: careKeys.actions(),
    queryFn: async () => (await fetchCareActions()).items,
    staleTime: 5 * 60_000,
  })

/** 오늘 완료 내역. 들어올 때마다 뒤에서 새로 받고(staleTime 0) 그동안은 직전 값을 그대로 보여준다. */
export const todayCareCompletionsQueryOptions = () =>
  queryOptions({
    queryKey: careKeys.today(),
    queryFn: fetchTodayCareCompletions,
  })

export function useCareActions() {
  return useQuery(careActionsQueryOptions())
}

export function useTodayCareCompletions() {
  return useQuery(todayCareCompletionsQueryOptions())
}

/** 완료·취소 응답을 오늘 완료 내역과 양털 잔액 캐시에 바로 넣는다(다시 받기 전에 숫자가 먼저 바뀌게). */
function applyCompletion(queryClient: QueryClient, completion: CareCompletion, balance: number) {
  queryClient.setQueryData(careKeys.today(), (old?: TodayCareCompletionsResponse) => {
    if (!old) return old
    const rest = old.items.filter((item) => item.completionId !== completion.completionId)
    return { ...old, items: [...rest, completion] }
  })
  queryClient.setQueryData(woolKeys.wallet(), (old?: WoolWallet): WoolWallet => ({
    balance,
    updatedAt: completion.cancelledAt ?? completion.completedAt ?? old?.updatedAt ?? null,
  }))
  // 홈 요약·양털 다시 받기는 app/queryClient.ts 의 공통 규칙(모든 mutation 성공)이 맡는다
  void queryClient.invalidateQueries({ queryKey: careKeys.today() })
}

/** 응답을 못 받은 실패(네트워크·시간 초과)·처리 중 충돌은 서버에 반영됐을 수 있어 같은 키로 다시 보낸다 */
const shouldKeepKey = (error: unknown) =>
  !isApiError(error) || error.status === 0 || error.code === 'COMMON_IDEMPOTENCY_CONFLICT'

/** 같은 동작(행동·완료 회차)을 다시 시도할 때 같은 Idempotency-Key 를 쓰게 키를 보관한다 */
function useIdempotencyKeys() {
  const keys = useRef(new Map<string, string>())
  return {
    take: (op: string) => {
      let key = keys.current.get(op)
      if (!key) {
        key = newIdempotencyKey()
        keys.current.set(op, key)
      }
      return key
    },
    settle: (op: string, error?: unknown) => {
      if (error === undefined || !shouldKeepKey(error)) keys.current.delete(op)
    },
  }
}

export function useCompleteCareAction() {
  const queryClient = useQueryClient()
  const keys = useIdempotencyKeys()
  return useMutation({
    mutationFn: async (careActionId: string) => {
      const op = `complete:${careActionId}`
      try {
        const result = await completeCareAction(careActionId, keys.take(op))
        keys.settle(op)
        return result
      } catch (error) {
        keys.settle(op, error)
        throw error
      }
    },
    onSuccess: ({ completion, balance }) => applyCompletion(queryClient, completion, balance),
    onError: (error) => {
      // 다른 기기에서 이미 완료 → 오늘 내역을 다시 받으면 완료로 보인다. 행동이 사라짐·비활성 → 목록을 다시 받는다
      if (hasErrorCode(error, CARE_ALREADY_COMPLETED)) void queryClient.invalidateQueries({ queryKey: careKeys.today() })
      if (hasErrorCode(error, CARE_ACTION_INACTIVE) || hasErrorCode(error, CARE_ACTION_NOT_FOUND))
        void queryClient.invalidateQueries({ queryKey: careKeys.actions() })
    },
  })
}

export function useCancelCareCompletion() {
  const queryClient = useQueryClient()
  const keys = useIdempotencyKeys()
  return useMutation({
    mutationFn: async ({ completionId, earningTransactionId }: { completionId: string; earningTransactionId: string }) => {
      const op = `cancel:${completionId}:${earningTransactionId}`
      try {
        const result = await cancelCareCompletion(completionId, earningTransactionId, keys.take(op))
        keys.settle(op)
        return result
      } catch (error) {
        keys.settle(op, error)
        throw error
      }
    },
    onSuccess: ({ completion, balance }) => applyCompletion(queryClient, completion, balance),
    onError: (error) => {
      // 상태가 바뀐 경우(이미 취소·회차 바뀜·날짜 지남·없음) — 오늘 내역을 다시 받아 지금 상태로 맞춘다
      if (
        [CARE_ALREADY_CANCELLED, CARE_COMPLETION_CYCLE_CHANGED, CARE_CANCEL_DATE_EXPIRED, CARE_COMPLETION_NOT_FOUND].some(
          (code) => hasErrorCode(error, code),
        )
      )
        void queryClient.invalidateQueries({ queryKey: careKeys.today() })
    },
  })
}
