import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { currentRestQueryOptions } from './restQueries'
import type { RestState } from './types'

/** 현재 휴식 상태(진행 중 우선, 없으면 최근 세션). 실패하거나 다시 확인할 때 `retry` 로 다시 받는다(렌더마다 같은 함수). */
export function useCurrentRestSession() {
  const { data, isError, refetch } = useQuery(currentRestQueryOptions())

  const state: RestState = data
    ? { status: 'success', ...data }
    : isError
      ? { status: 'error' }
      : { status: 'loading' }

  const retry = useCallback(() => void refetch(), [refetch])

  return { state, retry }
}
