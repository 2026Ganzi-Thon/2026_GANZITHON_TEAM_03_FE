import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode, isApiError } from '@/shared/api'
import { REST_NOT_ENDED, REST_SESSION_NOT_FOUND, saveAfterMemo } from './restApi'
import { applyRestSession, restKeys } from './restQueries'
import type { SaveAfterMemoState } from './types'

/**
 * 끝난 휴식에 한 줄 메모를 남긴다. 성공하면 현재 상태 캐시의 세션을 메모가 들어간 값으로 바꾼다.
 * 404·409(아직 안 끝남)면 현재 상태를 다시 받는다.
 */
export function useSaveAfterMemo() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ sessionId, afterMemo }: { sessionId: string; afterMemo: string }) =>
      saveAfterMemo(sessionId, afterMemo.trim() === '' ? null : afterMemo),
    onSuccess: ({ session }) => applyRestSession(queryClient, session),
    onError: (error) => {
      if (hasErrorCode(error, REST_SESSION_NOT_FOUND) || hasErrorCode(error, REST_NOT_ENDED))
        void queryClient.invalidateQueries({ queryKey: restKeys.current() })
    },
  })

  const { error } = mutation
  const state: SaveAfterMemoState =
    mutation.status === 'pending'
      ? { status: 'saving' }
      : mutation.status === 'error'
        ? hasErrorCode(error, REST_SESSION_NOT_FOUND)
          ? { status: 'not-found' }
          : hasErrorCode(error, REST_NOT_ENDED)
            ? { status: 'not-ended' }
            : isApiError(error) && error.status === 400
              ? { status: 'invalid' }
              : { status: 'error' }
        : { status: 'idle' }

  /** 남기고 성공 여부를 돌려준다. 저장 중에 다시 부르면 무시한다(false). */
  const save = async (sessionId: string, afterMemo: string): Promise<boolean> => {
    if (mutation.isPending) return false
    try {
      await mutation.mutateAsync({ sessionId, afterMemo })
      return true
    } catch {
      return false
    }
  }

  return { state, save, reset: mutation.reset }
}
