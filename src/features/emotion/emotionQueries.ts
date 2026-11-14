import { queryOptions } from '@tanstack/react-query'
import { fetchEmotionRecords, fetchEmotions } from './emotionApi'

const DAY = 24 * 60 * 60 * 1000

export const emotionKeys = {
  all: ['emotion'] as const,
  list: () => [...emotionKeys.all, 'list'] as const,
  records: () => [...emotionKeys.all, 'records'] as const,
}

/** 선택할 수 있는 감정 목록. 거의 안 바뀌어서 오래 신선하게 두고 캐시도 길게 들고 있는다. */
export const emotionsQueryOptions = () =>
  queryOptions({
    queryKey: emotionKeys.list(),
    queryFn: fetchEmotions,
    staleTime: DAY,
    gcTime: 7 * DAY,
  })

/** 최근 감정 기록. 저장하면 invalidate 해서 다시 받는다. */
export const emotionRecordsQueryOptions = () =>
  queryOptions({
    queryKey: emotionKeys.records(),
    queryFn: fetchEmotionRecords,
  })
