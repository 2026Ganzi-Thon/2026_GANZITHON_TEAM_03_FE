import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/shared/api'
import { EMOTION_RECORD_NOT_FOUND, deleteEmotionRecord } from './emotionApi'
import { emotionKeys, removeEmotionRecordFromList } from './emotionQueries'

export type DeleteEmotionRecordState = { status: 'idle' } | { status: 'deleting' } | { status: 'error' } | { status: 'success' }

/**
 * 감정 기록을 지운다. 404(이미 삭제됨)도 성공으로 본다.
 * 성공하면 목록 캐시에서 빼고 다시 받게 하며, 상세 캐시는 지운다. 뒤의 이동은 쓰는 쪽 몫이다.
 */
export function useDeleteEmotionRecord() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (recordId: string) => {
      try {
        await deleteEmotionRecord(recordId)
      } catch (error) {
        if (!hasErrorCode(error, EMOTION_RECORD_NOT_FOUND)) throw error
      }
      return recordId
    },
    onSuccess: (recordId) => {
      // 목록 화면으로 돌아갔을 때 지운 기록이 잠깐이라도 보이지 않게 캐시에서 먼저 빼고, 서버 값으로 다시 받는다.
      // 다시 받기는 기다리지 않는다 — 캐시를 이미 고쳤으니 바로 목록으로 돌아가도 된다
      removeEmotionRecordFromList(queryClient, recordId)
      queryClient.removeQueries({ queryKey: emotionKeys.record(recordId), exact: true })
      void queryClient.invalidateQueries({ queryKey: emotionKeys.records() })
    },
  })

  const state: DeleteEmotionRecordState =
    mutation.status === 'pending'
      ? { status: 'deleting' }
      : mutation.status === 'success'
        ? { status: 'success' }
        : mutation.status === 'error'
          ? { status: 'error' }
          : { status: 'idle' }

  /** 지우고 성공 여부를 돌려준다. 지우는 중에 다시 부르면 무시한다(false). */
  const remove = async (recordId: string): Promise<boolean> => {
    if (mutation.isPending) return false
    try {
      await mutation.mutateAsync(recordId)
      return true
    } catch {
      // 오류는 mutation 상태로 노출된다
      return false
    }
  }

  return { state, remove, reset: mutation.reset }
}
