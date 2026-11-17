import { useQuery } from '@tanstack/react-query'
import { islandItemsQueryOptions } from './islandQueries'
import type { IslandItemsState } from './types'

/** 섬 꾸미기 아이템 목록과 양털 잔액. 실패하면 `retry` 로 다시 시도한다. */
export function useIslandItems() {
  const { data, isError, refetch } = useQuery(islandItemsQueryOptions())

  const state: IslandItemsState = data
    ? { status: 'success', woolBalance: data.woolBalance, items: data.items }
    : isError
      ? { status: 'error' }
      : { status: 'loading' }

  return { state, retry: () => void refetch() }
}
