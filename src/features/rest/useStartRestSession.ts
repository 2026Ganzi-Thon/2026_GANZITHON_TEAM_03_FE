import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode, newIdempotencyKey } from '@/shared/api'
import { REST_ALREADY_RUNNING, startRestSession } from './restApi'
import { applyRestSession, restKeys, serverOffsetOf } from './restQueries'
import type { StartRestSessionState } from './types'

/**
 * 휴식을 시작한다. 성공하면 현재 상태 캐시를 진행 중 세션으로 바로 바꾼다.
 * 이미 진행 중인 휴식이 있으면(409) 현재 상태를 다시 받는다 — 화면은 그 결과로 진행 중 화면으로 간다.
 */
export function useStartRestSession() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    // 한 번의 시작 시도마다 키를 하나 만든다 — 실제 API 연결 때 헤더로 나간다
    mutationFn: ({ durationSeconds, idempotencyKey }: { durationSeconds: number; idempotencyKey: string }) =>
      startRestSession(durationSeconds, idempotencyKey),
    onSuccess: ({ serverTime, session }) => applyRestSession(queryClient, session, serverOffsetOf(serverTime)),
    onError: (error) => {
      if (hasErrorCode(error, REST_ALREADY_RUNNING)) void queryClient.invalidateQueries({ queryKey: restKeys.current() })
    },
  })

  const state: StartRestSessionState =
    mutation.status === 'pending'
      ? { status: 'starting' }
      : mutation.status === 'error'
        ? hasErrorCode(mutation.error, REST_ALREADY_RUNNING)
          ? { status: 'already-running' }
          : { status: 'error' }
        : { status: 'idle' }

  /** 시작한다. 이미 시작하는 중이면 무시한다(연타 방지). 시작했으면 true — 실패 내용은 `state` 로 본다 */
  const start = async (durationSeconds: number): Promise<boolean> => {
    if (mutation.isPending) return false
    try {
      await mutation.mutateAsync({ durationSeconds, idempotencyKey: newIdempotencyKey() })
      return true
    } catch {
      return false
    }
  }

  return { state, start }
}
