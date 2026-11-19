import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/shared/api'
import { CONCERN_NOT_FOUND, deleteConcern } from './cheeseApi'
import { cheeseKeys, removeConcernFromMyLists } from './cheeseQueries'

export type DeleteConcernState = { status: 'idle' } | { status: 'deleting' } | { status: 'error' } | { status: 'success' }

/**
 * 내 고민을 지운다(받은 위로도 함께). 404(이미 지움)도 성공으로 본다.
 * 성공하면 내 고민·보관함 목록 캐시에서 먼저 빼고 다시 받게 하며, 상세·위로 캐시는 지운다. 뒤의 이동은 쓰는 쪽 몫이다.
 * 홈 요약(숙성 치즈 수)은 app/queryClient.ts 공통 규칙이 다시 받는다.
 */
export function useDeleteConcern() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (concernId: string) => {
      try {
        await deleteConcern(concernId)
      } catch (error) {
        if (!hasErrorCode(error, CONCERN_NOT_FOUND)) throw error
      }
      return concernId
    },
    onSuccess: (concernId) => {
      removeConcernFromMyLists(queryClient, concernId)
      queryClient.removeQueries({ queryKey: cheeseKeys.concern(concernId), exact: true })
      queryClient.removeQueries({ queryKey: cheeseKeys.replies(concernId), exact: true })
      void queryClient.invalidateQueries({ queryKey: cheeseKeys.myConcerns() })
      void queryClient.invalidateQueries({ queryKey: cheeseKeys.savedConcerns() })
    },
  })

  const state: DeleteConcernState =
    mutation.status === 'pending'
      ? { status: 'deleting' }
      : mutation.status === 'success'
        ? { status: 'success' }
        : mutation.status === 'error'
          ? { status: 'error' }
          : { status: 'idle' }

  /** 지우고 성공 여부를 돌려준다. 지우는 중에 다시 부르면 무시한다(false). */
  const remove = async (concernId: string): Promise<boolean> => {
    if (mutation.isPending) return false
    try {
      await mutation.mutateAsync(concernId)
      return true
    } catch {
      return false
    }
  }

  return { state, remove, reset: mutation.reset }
}
