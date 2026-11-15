import { queryOptions } from '@tanstack/react-query'
import { fetchHomeSummary } from './homeApi'

export const homeKeys = {
  all: ['home'] as const,
  summary: () => [...homeKeys.all, 'summary'] as const,
}

/**
 * 홈 요약(닉네임·양털·오늘의 감정·숙성 치즈 수). 캐시해 두었다가 홈에 다시 들어오면 이전 값을 바로 보여주고,
 * 값이 다른 화면에서 바뀔 수 있어(감정 기록·양털) 들어올 때마다 뒤에서 새로 받는다(staleTime 기본 0).
 */
export const homeSummaryQueryOptions = () =>
  queryOptions({
    queryKey: homeKeys.summary(),
    queryFn: fetchHomeSummary,
  })
