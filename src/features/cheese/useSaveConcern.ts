import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/shared/api'
import { CONCERN_NOT_FOUND, CONCERN_NOT_OPENED, saveConcern, unsaveConcern } from './cheeseApi'
import { cheeseKeys } from './cheeseQueries'
import type { ConcernDetail, ConcernRepliesResponse, ConcernStatus, MyConcernListResponse } from './types'

export type SaveConcernState =
  | { status: 'idle' }
  /** 보관하는 중(save) 또는 보관함에서 빼는 중(unsave) */
  | { status: 'pending'; action: 'save' | 'unsave' }
  | { status: 'error'; action: 'save' | 'unsave' }
  /** 아직 개봉하지 않은 치즈(409) — 상세를 다시 받아 지금 상태로 맞춘다 */
  | { status: 'not-opened' }

/**
 * 내 치즈를 보관함에 넣거나 뺀다. 성공하면 상세·받은 위로·내 고민 목록 캐시의 상태를 바로 바꾸고, 내 고민·보관함 목록은 다시 받게 한다.
 * 404(지워졌거나 내 고민이 아님)는 상세를 다시 받아 "찾을 수 없어요"로 바뀌게 한다.
 */
export function useSaveConcern(concernId: string) {
  const queryClient = useQueryClient()

  const applyStatus = (status: ConcernStatus) => {
    queryClient.setQueryData(cheeseKeys.concern(concernId), (old?: ConcernDetail) => old && { ...old, status })
    if (status === 'OPENED' || status === 'SAVED') {
      queryClient.setQueryData(cheeseKeys.replies(concernId), (old?: ConcernRepliesResponse) => old && { ...old, status })
    }
    queryClient.setQueryData(cheeseKeys.myConcerns(), (old?: MyConcernListResponse) =>
      old && { ...old, items: old.items.map((item) => (item.concernId === concernId ? { ...item, status } : item)) },
    )
    void queryClient.invalidateQueries({ queryKey: cheeseKeys.myConcerns() })
    void queryClient.invalidateQueries({ queryKey: cheeseKeys.savedConcerns() })
  }

  const mutation = useMutation({
    mutationFn: async (action: 'save' | 'unsave'): Promise<ConcernStatus> =>
      action === 'save' ? (await saveConcern(concernId)).status : (await unsaveConcern(concernId)).status,
    onSuccess: applyStatus,
    onError: (error) => {
      if (hasErrorCode(error, CONCERN_NOT_FOUND) || hasErrorCode(error, CONCERN_NOT_OPENED)) {
        void queryClient.invalidateQueries({ queryKey: cheeseKeys.concern(concernId) })
      }
    },
  })

  const action = mutation.variables ?? 'save'
  const state: SaveConcernState =
    mutation.status === 'pending'
      ? { status: 'pending', action }
      : mutation.status === 'error'
        ? hasErrorCode(mutation.error, CONCERN_NOT_OPENED)
          ? { status: 'not-opened' }
          : { status: 'error', action }
        : { status: 'idle' }

  const run = (next: 'save' | 'unsave') => {
    if (!mutation.isPending) mutation.mutate(next)
  }

  return { state, save: () => run('save'), unsave: () => run('unsave') }
}
