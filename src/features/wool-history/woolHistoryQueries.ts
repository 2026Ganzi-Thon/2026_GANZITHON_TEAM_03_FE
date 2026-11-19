import { infiniteQueryOptions } from '@tanstack/react-query'
import { woolKeys } from '@/shared/wool'
import { fetchWoolTransactions } from './woolHistoryApi'

/**
 * 양털 키(`['wool', …]`) 아래에 둔다 — 어떤 저장이든 성공하면 app/queryClient 가 woolKeys.all 을 다시 받으므로
 * 돌봄 완료·취소 뒤에 내역도 따로 연결하지 않아도 새로 받는다.
 */
export const woolHistoryKeys = {
  all: [...woolKeys.all, 'transactions'] as const,
}

/** 양털 변동 내역(페이지 0부터, hasNext 가 true 면 다음 페이지). 들어올 때마다 뒤에서 새로 받는다. */
export const woolHistoryQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: woolHistoryKeys.all,
    queryFn: ({ pageParam }) => fetchWoolTransactions(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
  })
