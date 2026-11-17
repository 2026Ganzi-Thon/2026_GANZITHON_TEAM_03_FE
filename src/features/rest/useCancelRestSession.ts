import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/shared/api'
import { REST_SESSION_NOT_FOUND, cancelRestSession } from './restApi'
import { applyRestSession, restKeys } from './restQueries'
import type { CancelRestSessionState } from './types'

/**
 * 진행 중 휴식을 중도 종료한다. 성공하면 현재 상태 캐시에 끝난 세션(CANCELLED, 또는 이미 지났으면 COMPLETED)을 넣는다.
 * 없는 세션(404)이면 현재 상태를 다시 받는다.
 */
export function useCancelRestSession() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (sessionId: string) => cancelRestSession(sessionId),
    onSuccess: ({ session }) => applyRestSession(queryClient, session),
    onError: (error) => {
      if (hasErrorCode(error, REST_SESSION_NOT_FOUND)) void queryClient.invalidateQueries({ queryKey: restKeys.current() })
    },
  })

  const state: CancelRestSessionState =
    mutation.status === 'pending'
      ? { status: 'cancelling' }
      : mutation.status === 'error'
        ? { status: 'error' }
        : { status: 'idle' }

  /** 끝낸다. 이미 끝내는 중이면 무시한다. 끝냈으면 true */
  const cancel = async (sessionId: string): Promise<boolean> => {
    if (mutation.isPending) return false
    try {
      await mutation.mutateAsync(sessionId)
      return true
    } catch {
      return false
    }
  }

  return { state, cancel, reset: mutation.reset }
}
