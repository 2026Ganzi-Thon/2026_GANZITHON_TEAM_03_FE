import { useQuery } from '@tanstack/react-query'
import { savedConcernsQueryOptions } from './cheeseQueries'
import type { SavedConcernListState } from './types'

/** 보관한 치즈 목록. 실패하면 `retry` 로 다시 시도한다. */
export function useSavedConcerns() {
  const { data, isError, refetch } = useQuery(savedConcernsQueryOptions())

  const state: SavedConcernListState = data
    ? { status: 'success', items: data.items, hasNext: data.hasNext }
    : isError
      ? { status: 'error' }
      : { status: 'loading' }

  return { state, retry: () => void refetch() }
}
