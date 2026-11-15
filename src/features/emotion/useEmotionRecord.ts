import { useQuery, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/shared/api'
import { EMOTION_RECORD_NOT_FOUND } from './emotionApi'
import { emotionRecordQueryOptions, findEmotionRecordInList } from './emotionQueries'
import type { EmotionRecord } from './types'

export type EmotionRecordState =
  | { status: 'loading' }
  | { status: 'error' }
  /** 404 — 없거나 이미 삭제한 기록 */
  | { status: 'not-found' }
  | { status: 'success'; record: EmotionRecord }

/**
 * 감정 기록 한 건. 목록에서 들어오면 목록 캐시의 같은 기록을 먼저 보여주고(로딩 없음) 뒤에서 서버 값으로 바꾼다.
 * 실패하면 `retry` 로 다시 시도한다.
 */
export function useEmotionRecord(recordId: string) {
  const queryClient = useQueryClient()
  const { data, error, isError, refetch } = useQuery({
    ...emotionRecordQueryOptions(recordId),
    placeholderData: () => findEmotionRecordInList(queryClient, recordId),
  })

  // 404 는 목록 캐시 값(placeholder)이 있어도 "없는 기록"으로 보여준다
  const state: EmotionRecordState =
    isError && hasErrorCode(error, EMOTION_RECORD_NOT_FOUND)
      ? { status: 'not-found' }
      : data
        ? { status: 'success', record: data }
        : isError
          ? { status: 'error' }
          : { status: 'loading' }

  return { state, retry: () => void refetch() }
}
