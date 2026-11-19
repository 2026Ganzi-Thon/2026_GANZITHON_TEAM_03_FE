import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/shared/api'
import { EMOTION_INVALID_SELECTION, EMOTION_RECORD_NOT_FOUND, updateEmotionRecord } from './emotionApi'
import { emotionKeys, removeEmotionRecordFromList, replaceEmotionRecordInList } from './emotionQueries'
import type { EmotionRecord, UpdateEmotionRecordRequest } from './types'

export type UpdateEmotionRecordState =
  | { status: 'idle' }
  | { status: 'submitting' }
  /** 404 — 그새 지워진 기록 */
  | { status: 'not-found' }
  /** 400 EMOTION_INVALID_SELECTION — 그새 비활성이 된 감정을 새로 골랐다 등. 감정 목록을 다시 받는다 */
  | { status: 'invalid-selection' }
  | { status: 'error' }
  | { status: 'success'; record: EmotionRecord }

/**
 * 감정 기록을 고친다. 성공하면 상세 캐시에 새 값을 넣고 목록 캐시의 같은 기록을 바꾼 뒤 목록을 다시 받는다.
 * 홈 요약·양털은 app/queryClient 의 공통 규칙이 다시 받는다. 뒤의 이동은 쓰는 쪽 몫이다.
 */
export function useUpdateEmotionRecord(recordId: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (body: UpdateEmotionRecordRequest) => updateEmotionRecord(recordId, body),
    onSuccess: (record) => {
      queryClient.setQueryData(emotionKeys.record(recordId), record)
      replaceEmotionRecordInList(queryClient, record)
      void queryClient.invalidateQueries({ queryKey: emotionKeys.records() })
    },
    onError: (error) => {
      if (hasErrorCode(error, EMOTION_RECORD_NOT_FOUND)) {
        removeEmotionRecordFromList(queryClient, recordId)
        void queryClient.invalidateQueries({ queryKey: emotionKeys.records() })
      } else if (hasErrorCode(error, EMOTION_INVALID_SELECTION)) {
        void queryClient.invalidateQueries({ queryKey: emotionKeys.list() })
      }
    },
  })

  const state: UpdateEmotionRecordState =
    mutation.status === 'pending'
      ? { status: 'submitting' }
      : mutation.status === 'success'
        ? { status: 'success', record: mutation.data }
        : mutation.status === 'error'
          ? hasErrorCode(mutation.error, EMOTION_RECORD_NOT_FOUND)
            ? { status: 'not-found' }
            : hasErrorCode(mutation.error, EMOTION_INVALID_SELECTION)
              ? { status: 'invalid-selection' }
              : { status: 'error' }
          : { status: 'idle' }

  /** 고치고 성공 여부를 돌려준다. 저장 중에 다시 부르면 무시한다(false). */
  const submit = async (body: UpdateEmotionRecordRequest): Promise<boolean> => {
    if (mutation.isPending) return false
    try {
      await mutation.mutateAsync(body)
      return true
    } catch {
      // 오류는 mutation 상태로 노출된다
      return false
    }
  }

  return { state, submit }
}
