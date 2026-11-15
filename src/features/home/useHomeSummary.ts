import { useQuery } from '@tanstack/react-query'
import { homeSummaryQueryOptions } from './homeQueries'
import type { HomeSummary } from './homeApi'

export type HomeSummaryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: HomeSummary }

/**
 * 홈 요약을 불러온다. 한 번 받은 값은 캐시에 남아서 홈에 다시 들어오면 로딩 없이 바로 보이고 뒤에서 새로 받는다.
 * 받아 둔 값이 없을 때 실패하면 `retry` 로 다시 시도한다(값이 있으면 다시 받기가 실패해도 이전 값을 그대로 보여준다).
 */
export function useHomeSummary() {
  const { data, isError, refetch } = useQuery(homeSummaryQueryOptions())

  const state: HomeSummaryState = data
    ? { status: 'success', data }
    : isError
      ? { status: 'error' }
      : { status: 'loading' }

  return { state, retry: () => void refetch() }
}
