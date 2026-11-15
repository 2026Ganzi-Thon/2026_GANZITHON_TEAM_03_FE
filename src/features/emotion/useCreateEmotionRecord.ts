import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/shared/api'
import { EMOTION_RECORD_ALREADY_EXISTS, createEmotionRecord } from './emotionApi'
import { emotionKeys } from './emotionQueries'
import type { EmotionFormValues, EmotionRecord, EmotionRecordListResponse } from './types'

export type CreateEmotionRecordState =
  | { status: 'idle' }
  | { status: 'submitting' }
  /** 오늘 이미 기록함(409) */
  | { status: 'already-exists' }
  | { status: 'error' }
  | { status: 'success'; record: EmotionRecord }

/** 오늘의 감정 기록을 저장한다. 성공하면 기록 목록을 다시 받게 하고, 뒤의 연출·이동은 쓰는 쪽 몫이다. */
export function useCreateEmotionRecord() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ emotionIds, memo }: EmotionFormValues) =>
      createEmotionRecord({ emotionIds, memo: memo.trim() === '' ? null : memo }),
    onSuccess: (record) => {
      // 목록 화면이 마운트되기 전에도 새 기록이 바로 보이게 캐시에 먼저 끼워 넣고, 서버 값으로 다시 받는다
      queryClient.setQueryData(emotionKeys.records(), (old?: EmotionRecordListResponse) =>
        old ? { ...old, items: [record, ...old.items] } : old,
      )
      return queryClient.invalidateQueries({ queryKey: emotionKeys.records() })
    },
  })

  const state: CreateEmotionRecordState =
    mutation.status === 'pending'
      ? { status: 'submitting' }
      : mutation.status === 'success'
        ? { status: 'success', record: mutation.data }
        : mutation.status === 'error'
          ? { status: hasErrorCode(mutation.error, EMOTION_RECORD_ALREADY_EXISTS) ? 'already-exists' : 'error' }
          : { status: 'idle' }

  const submit = async (values: EmotionFormValues) => {
    if (mutation.isPending) return
    try {
      await mutation.mutateAsync(values)
    } catch {
      // 오류는 mutation 상태로 노출된다
    }
  }

  return { state, submit }
}
