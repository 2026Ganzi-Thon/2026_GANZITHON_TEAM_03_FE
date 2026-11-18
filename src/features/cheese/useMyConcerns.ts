import { useQuery } from '@tanstack/react-query'
import { myConcernsQueryOptions } from './cheeseQueries'
import type { MyConcernListState } from './types'

/** 내가 쓴 고민(치즈 보관함) 목록. 실패하면 `retry` 로 다시 시도한다. */
export function useMyConcerns() {
  const { data, isError, refetch } = useQuery(myConcernsQueryOptions())

  const state: MyConcernListState = data
    ? { status: 'success', items: data.items, hasNext: data.hasNext }
    : isError
      ? { status: 'error' }
      : { status: 'loading' }

  return { state, retry: () => void refetch() }
}
