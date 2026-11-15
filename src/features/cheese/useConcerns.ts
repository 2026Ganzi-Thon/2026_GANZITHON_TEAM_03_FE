import { useQuery } from '@tanstack/react-query'
import { concernsQueryOptions } from './cheeseQueries'
import type { ConcernCard } from './types'

export type ConcernsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: ConcernCard[] }

/** 위로할 고민 목록. 한 번 받으면 캐시를 그대로 쓴다(재조회 없음). 실패하면 `retry` 로 다시 시도한다. */
export function useConcerns() {
  const { data, isError, refetch } = useQuery(concernsQueryOptions())

  const state: ConcernsState = data
    ? { status: 'success', items: data.items }
    : isError
      ? { status: 'error' }
      : { status: 'loading' }

  return { state, retry: () => void refetch() }
}
