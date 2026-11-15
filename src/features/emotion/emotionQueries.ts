import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { fetchEmotionRecord, fetchEmotionRecords, fetchEmotions } from './emotionApi'
import type { EmotionRecord, EmotionRecordListResponse } from './types'

const DAY = 24 * 60 * 60 * 1000

export const emotionKeys = {
  all: ['emotion'] as const,
  list: () => [...emotionKeys.all, 'list'] as const,
  records: () => [...emotionKeys.all, 'records'] as const,
  record: (recordId: string) => [...emotionKeys.all, 'record', recordId] as const,
}

/** 선택할 수 있는 감정 목록. 거의 안 바뀌어서 오래 신선하게 두고 캐시도 길게 들고 있는다. */
export const emotionsQueryOptions = () =>
  queryOptions({
    queryKey: emotionKeys.list(),
    queryFn: fetchEmotions,
    staleTime: DAY,
    gcTime: 7 * DAY,
  })

/** 최근 감정 기록. 저장·삭제하면 invalidate 해서 다시 받는다. */
export const emotionRecordsQueryOptions = () =>
  queryOptions({
    queryKey: emotionKeys.records(),
    queryFn: fetchEmotionRecords,
  })

/** 감정 기록 한 건. 404(없는 기록)는 다시 시도해도 같으므로 재시도하지 않는다. 목록 캐시를 먼저 보여주는 건 `useEmotionRecord` 몫. */
export const emotionRecordQueryOptions = (recordId: string) =>
  queryOptions({
    queryKey: emotionKeys.record(recordId),
    queryFn: () => fetchEmotionRecord(recordId),
    retry: false,
  })

/** 목록 캐시에 있는 같은 기록. 상세를 스켈레톤 없이 바로 보여줄 때 쓴다. */
export function findEmotionRecordInList(queryClient: QueryClient, recordId: string): EmotionRecord | undefined {
  return queryClient
    .getQueryData<EmotionRecordListResponse>(emotionKeys.records())
    ?.items.find((record) => record.recordId === recordId)
}

/** 목록 캐시에서 기록 하나를 뺀다(삭제했거나 없는 기록). */
export function removeEmotionRecordFromList(queryClient: QueryClient, recordId: string): void {
  queryClient.setQueryData(emotionKeys.records(), (old?: EmotionRecordListResponse) =>
    old ? { ...old, items: old.items.filter((record) => record.recordId !== recordId) } : old,
  )
}
