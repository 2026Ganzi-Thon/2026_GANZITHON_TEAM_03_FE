import { useQuery } from '@tanstack/react-query'
import { emotionRecordsQueryOptions } from './emotionQueries'
import type { EmotionRecordsState } from './types'

/** 최근 감정 기록을 불러온다. 실패하면 `retry` 로 다시 시도한다. */
export function useEmotionRecords() {
  const { data, isError, refetch } = useQuery(emotionRecordsQueryOptions())

  const state: EmotionRecordsState = data
    ? { status: 'success', records: data.items, hasNext: data.hasNext }
    : isError
      ? { status: 'error' }
      : { status: 'loading' }

  return { state, retry: () => void refetch() }
}
