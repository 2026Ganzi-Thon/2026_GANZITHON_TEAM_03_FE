import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { fetchCurrentRestSession } from './restApi'
import type { RestSession, RestSnapshot } from './types'

export const restKeys = {
  all: ['rest'] as const,
  current: () => [...restKeys.all, 'current'] as const,
}

/** 응답의 serverTime 으로 (서버 시각 - 기기 시각)을 잰다. 받은 순간에 재야 한다 */
export const serverOffsetOf = (serverTime: string) => Date.parse(serverTime) - Date.now()

/**
 * 현재 휴식 상태. 들어올 때마다 뒤에서 새로 받고(staleTime 0), 탭이 다시 보이면 다시 받는다.
 * TanStack Query v5 의 창 포커스 감지는 `visibilitychange` 를 쓴다 — 앱 전체 기본값은 꺼져 있어(app/queryClient.ts)
 * 이 쿼리만 켠다. 남은 시간은 매초 부르지 않고 이 값으로 화면에서 계산한다(useRestCountdown).
 */
export const currentRestQueryOptions = () =>
  queryOptions({
    queryKey: restKeys.current(),
    queryFn: async (): Promise<RestSnapshot> => {
      const { serverTime, session } = await fetchCurrentRestSession()
      return { session, serverOffsetMs: serverOffsetOf(serverTime) }
    },
    refetchOnWindowFocus: 'always',
  })

/** 시작·중도 종료 결과를 현재 상태 캐시에 바로 반영한다. 시각 차이를 새로 잴 수 없으면 전에 잰 값을 둔다 */
export function applyRestSession(queryClient: QueryClient, session: RestSession, serverOffsetMs?: number): void {
  queryClient.setQueryData(restKeys.current(), (old?: RestSnapshot) => ({
    session,
    serverOffsetMs: serverOffsetMs ?? old?.serverOffsetMs ?? 0,
  }))
}
