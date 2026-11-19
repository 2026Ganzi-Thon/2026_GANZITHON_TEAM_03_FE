import { useCallback, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { groupByDay } from './groupByDay'
import { woolHistoryQueryOptions } from './woolHistoryQueries'
import type { WoolHistoryState } from './types'

/** 양털 변동 내역(날짜별). `loadMore` 로 다음 페이지, `retry` 로 처음부터 다시 받는다. */
export function useWoolHistory() {
  const { data, isError, isFetchingNextPage, isFetchNextPageError, hasNextPage, fetchNextPage, refetch } = useInfiniteQuery(woolHistoryQueryOptions())

  const days = useMemo(() => (data ? groupByDay(data.pages.flatMap((page) => page.items)) : []), [data])

  // 첫 페이지 실패만 화면 전체 오류. 다음 페이지 실패는 받은 목록 아래에 작게
  const state: WoolHistoryState = data
    ? {
        status: 'success',
        days,
        hasNext: hasNextPage,
        loadingMore: isFetchingNextPage,
        moreError: isFetchNextPageError,
      }
    : isError
      ? { status: 'error' }
      : { status: 'loading' }

  // 목록이 IntersectionObserver 를 다시 걸지 않게 같은 함수를 유지한다
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])
  const retry = useCallback(() => void refetch(), [refetch])

  return { state, loadMore, retry }
}
