import { MutationCache, QueryClient } from '@tanstack/react-query'
import { homeKeys } from '@/features/home'
import { woolKeys } from '@/shared/wool'

/**
 * 앱 전체에서 하나만 쓰는 QueryClient. 기본값은 라이브러리 그대로 두고 아래만 바꾼다.
 *
 * 어떤 mutation 이든 성공하면 홈 요약·양털을 뒤에서 바로 다시 받는다(지금 화면에 없어도 — refetchType 'all').
 * 홈 요약은 닉네임·양털·오늘의 감정을 모아 보여줘서 다른 기능의 저장(감정 기록 작성·삭제, 초기 설정, 구매 등)으로 바뀐다.
 * 기능끼리 import 할 수 없어서 각 기능 훅 대신 여기(app)에서 한 번에 연결한다. 홈에 돌아가기 전에 새 값이 도착해 옛 배너가 잠깐도 안 보인다.
 * 기다리지 않는다 — 저장 화면의 다음 동작(연출·이동)을 늦추지 않게.
 */
export const queryClient: QueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeKeys.summary(), refetchType: 'all' })
      void queryClient.invalidateQueries({ queryKey: woolKeys.all, refetchType: 'all' })
    },
  }),
})
