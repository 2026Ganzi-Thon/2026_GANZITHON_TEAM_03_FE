import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { fetchConcernDetail, fetchConcernReplies, fetchConcerns, fetchMyConcerns } from './cheeseApi'
import type { ConcernListResponse } from './types'

export const cheeseKeys = {
  all: ['cheese'] as const,
  concerns: () => [...cheeseKeys.all, 'concerns'] as const,
  concern: (concernId: string) => [...cheeseKeys.all, 'concern', concernId] as const,
  myConcerns: () => [...cheeseKeys.all, 'myConcerns'] as const,
  replies: (concernId: string) => [...cheeseKeys.all, 'replies', concernId] as const,
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

/**
 * 내가 쓴 고민(치즈 보관함) 목록. 상태(숙성 중→숙성 끝)가 시간에 따라 바뀌므로 들어올 때마다 뒤에서 다시 받는다(staleTime 기본 0).
 * 임의 결정(확인 필요): 첫 페이지만 최대 크기(50개)로 한 번 받고 화면에서 4개씩 나눈다 — 다음 페이지(hasNext) 불러오기는 아직 안 함.
 */
export const MY_CONCERNS_PAGE_SIZE = 50

export const myConcernsQueryOptions = () =>
  queryOptions({
    queryKey: cheeseKeys.myConcerns(),
    queryFn: () => fetchMyConcerns({ page: 0, size: MY_CONCERNS_PAGE_SIZE }),
  })

/** 개봉한 내 치즈의 받은 위로. 개봉 전(409)·남의 고민(404)은 재시도하지 않는다. */
export const concernRepliesQueryOptions = (concernId: string) =>
  queryOptions({
    queryKey: cheeseKeys.replies(concernId),
    queryFn: () => fetchConcernReplies(concernId),
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
