import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode, isOutcomeUnknown, newIdempotencyKey } from '@/shared/api'
import { REST_ALREADY_RUNNING, startRestSession } from './restApi'
import { applyRestSession, restKeys, serverOffsetOf } from './restQueries'
import type { StartRestSessionState } from './types'

/**
 * 휴식을 시작한다. 성공하면 현재 상태 캐시를 진행 중 세션으로 바로 바꾼다.
 * 이미 진행 중인 휴식이 있으면(409) 현재 상태를 다시 받는다 — 화면은 그 결과로 진행 중 화면으로 간다.
 */
export function useStartRestSession() {
  const queryClient = useQueryClient()
  // 같은 시간으로 다시 시작할 때, 앞 시도가 서버에 반영됐는지 모르면(응답 못 받음·5xx) 같은 키를 쓴다 — 두 번 시작되지 않게
  const keyRef = useRef<{ durationSeconds: number; key: string } | null>(null)
  const takeKey = (durationSeconds: number) => {
    if (keyRef.current?.durationSeconds !== durationSeconds) keyRef.current = { durationSeconds, key: newIdempotencyKey() }
    return keyRef.current.key
  }

  const mutation = useMutation({
    mutationFn: ({ durationSeconds, idempotencyKey }: { durationSeconds: number; idempotencyKey: string }) =>
      startRestSession(durationSeconds, idempotencyKey),
    onSuccess: ({ serverTime, session }) => {
      keyRef.current = null
      applyRestSession(queryClient, session, serverOffsetOf(serverTime))
    },
    onError: (error) => {
      if (!isOutcomeUnknown(error)) keyRef.current = null
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
      await mutation.mutateAsync({ durationSeconds, idempotencyKey: takeKey(durationSeconds) })
      return true
    } catch {
      return false
    }
  }

  return { state, start }
}
