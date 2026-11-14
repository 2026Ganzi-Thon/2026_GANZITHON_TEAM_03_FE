import { QueryClient } from '@tanstack/react-query'

/** 앱 전체에서 하나만 쓰는 QueryClient. 기본값은 라이브러리 그대로 두고 아래 둘만 바꾼다. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
