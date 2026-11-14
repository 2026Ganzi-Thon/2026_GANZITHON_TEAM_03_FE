import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { emotionsQueryOptions } from './emotionQueries'

/** 작성 화면으로 넘어가기 전에(양 먹이주기 화면이 뜰 때) 감정 목록을 미리 받아 캐시에 둔다. */
export function usePrefetchEmotions() {
  const queryClient = useQueryClient()

  useEffect(() => {
    void queryClient.prefetchQuery(emotionsQueryOptions())
  }, [queryClient])
}
