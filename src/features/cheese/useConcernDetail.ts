import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/shared/api'
import { CONCERN_NOT_FOUND } from './cheeseApi'
import { concernDetailQueryOptions, removeConcernFromList } from './cheeseQueries'
import type { ConcernDetail } from './types'

export type ConcernDetailState =
  | { status: 'loading' }
  | { status: 'error' }
  /** 404 — 없거나 삭제된 고민 */
  | { status: 'gone' }
  | { status: 'success'; concern: ConcernDetail }

/** 고민 상세. 사라졌거나 위로할 수 없게 된 고민이면 목록 캐시에서도 뺀다. */
export function useConcernDetail(concernId: string) {
  const queryClient = useQueryClient()
  const { data, error, isError, refetch } = useQuery(concernDetailQueryOptions(concernId))

  const gone = isError && hasErrorCode(error, CONCERN_NOT_FOUND)
  const closed = !!data && !data.replyable
  useEffect(() => {
    if (gone || closed) removeConcernFromList(queryClient, concernId)
  }, [gone, closed, queryClient, concernId])

  const state: ConcernDetailState = data
    ? { status: 'success', concern: data }
    : gone
      ? { status: 'gone' }
      : isError
        ? { status: 'error' }
        : { status: 'loading' }

  return { state, retry: () => void refetch() }
}
