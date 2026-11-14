import { useQuery } from '@tanstack/react-query'
import { emotionsQueryOptions } from './emotionQueries'
import type { Emotion } from './types'

export type EmotionsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; emotions: Emotion[] }

/** 선택할 수 있는 감정 목록. 캐시가 있으면 바로 `success` 다. 실패하면 `retry` 로 다시 시도한다. */
export function useEmotions() {
  const { data, isError, refetch } = useQuery(emotionsQueryOptions())

  const state: EmotionsState = data
    ? { status: 'success', emotions: data }
    : isError
      ? { status: 'error' }
      : { status: 'loading' }

  return { state, retry: () => void refetch() }
}
