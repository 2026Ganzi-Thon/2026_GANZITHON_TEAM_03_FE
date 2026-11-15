import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { fetchConcernDetail, fetchConcerns } from './cheeseApi'
import type { ConcernListResponse } from './types'

export const cheeseKeys = {
  all: ['cheese'] as const,
  concerns: () => [...cheeseKeys.all, 'concerns'] as const,
  concern: (concernId: string) => [...cheeseKeys.all, 'concern', concernId] as const,
}

/**
 * 위로할 고민 목록. docs/api/common.md "고민 목록 규칙"(확정): 진입 시 한 번만 받고, 상세에 다녀와도 같은 목록·순서를 쓴다.
 * 그래서 재조회를 전부 끈다(staleTime·gcTime 무한, 포커스·마운트·재연결 재조회 없음).
 * 임의 결정(확인 필요): 다른 탭에 갔다 다시 들어오는 것을 새 진입으로 볼지는 합의 전이라 지금은 유지한다.
 */
export const concernsQueryOptions = () =>
  queryOptions({
    queryKey: cheeseKeys.concerns(),
    queryFn: fetchConcerns,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

/** 고민 상세. 목록에서 받은 뒤 삭제·마감됐을 수 있어 열 때마다 다시 확인한다. 404 는 재시도하지 않는다. */
export const concernDetailQueryOptions = (concernId: string) =>
  queryOptions({
    queryKey: cheeseKeys.concern(concernId),
    queryFn: () => fetchConcernDetail(concernId),
    gcTime: 0,
    retry: false,
  })

/** 목록 캐시에서 고민 하나를 뺀다(위로를 남겼거나 마감·삭제된 고민). 재조회는 하지 않는다. */
export function removeConcernFromList(queryClient: QueryClient, concernId: string): void {
  queryClient.setQueryData(cheeseKeys.concerns(), (old?: ConcernListResponse) => {
    if (!old) return old
    const items = old.items.filter((item) => item.concernId !== concernId)
    return { ...old, items, count: items.length }
  })
}
