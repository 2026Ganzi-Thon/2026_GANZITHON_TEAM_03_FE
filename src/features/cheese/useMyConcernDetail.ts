import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/shared/api'
import { CONCERN_NOT_FOUND, openConcern } from './cheeseApi'
import { cheeseKeys, concernDetailQueryOptions, concernRepliesQueryOptions } from './cheeseQueries'
import type { ConcernDetail, Reply } from './types'

/** 받은 위로 자리의 상태. 숙성 중이면 아직 볼 수 없다(maturesAt 으로 남은 시간을 보여준다) */
export type MyConcernRepliesState =
  | { status: 'maturing'; maturesAt: string }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; replies: Reply[] }

export type MyConcernDetailState =
  | { status: 'loading' }
  | { status: 'error' }
  /** 404 이거나 내 고민이 아님 */
  | { status: 'gone' }
  | { status: 'success'; concern: ConcernDetail; replies: MyConcernRepliesState }

/**
 * 내 고민 상세(치즈 보관함에서 열기): 고민 본문 + 다른 사람들이 남긴 위로.
 * 숙성이 끝났는데 아직 안 열었으면(MATURED) 들어오자마자 개봉해서 위로를 보여준다 — 사용자 결정(2026-11-18).
 * 이미 열었으면(OPENED·SAVED) 받은 위로를 다시 받는다.
 */
export function useMyConcernDetail(concernId: string) {
  const queryClient = useQueryClient()
  const detail = useQuery(concernDetailQueryOptions(concernId))
  const concern = detail.data
  const opened = concern?.status === 'OPENED' || concern?.status === 'SAVED'
  const replies = useQuery({ ...concernRepliesQueryOptions(concernId), enabled: opened })

  const open = useMutation({
    mutationFn: () => openConcern(concernId),
    onSuccess: (data) => {
      // 받은 위로를 먼저 넣고 상세를 "개봉함"으로 바꿔서 위로 조회를 다시 부르지 않게 한다
      queryClient.setQueryData(cheeseKeys.replies(concernId), data)
      queryClient.setQueryData(cheeseKeys.concern(concernId), (old?: ConcernDetail) => old && { ...old, status: data.status })
      // 보관함 목록의 상태도 바뀌었다(다음에 볼 때 새로 받음)
      void queryClient.invalidateQueries({ queryKey: cheeseKeys.myConcerns() })
    },
  })
  const { mutate: openNow, status: openStatus } = open
  const shouldOpen = concern?.mine === true && concern.status === 'MATURED'
  useEffect(() => {
    if (shouldOpen && openStatus === 'idle') openNow()
  }, [shouldOpen, openStatus, openNow])

  // 숙성이 끝나는 순간 상세를 다시 받는다 — 서버 숙성 시간이 10분이라 화면을 보며 기다리는 경우가 많다.
  // MATURED 가 되면 위의 effect 가 바로 개봉해 받은 위로를 보여준다
  const maturesAt = concern?.status === 'MATURING' ? concern.maturesAt : null
  const { refetch: refetchDetail } = detail
  useEffect(() => {
    if (!maturesAt) return
    const wait = Math.max(0, Date.parse(maturesAt) - Date.now()) + 1000
    const timer = window.setTimeout(() => void refetchDetail(), Math.min(wait, 2 ** 31 - 1))
    return () => window.clearTimeout(timer)
  }, [maturesAt, refetchDetail])

  const gone = (detail.isError && hasErrorCode(detail.error, CONCERN_NOT_FOUND)) || (concern !== undefined && !concern.mine)

  let state: MyConcernDetailState
  if (gone) state = { status: 'gone' }
  else if (!concern) state = detail.isError ? { status: 'error' } : { status: 'loading' }
  else {
    const repliesState: MyConcernRepliesState =
      concern.status === 'MATURING'
        ? { status: 'maturing', maturesAt: concern.maturesAt ?? concern.createdAt }
        : replies.data
          ? { status: 'success', replies: replies.data.replies }
          : replies.isError || open.isError
            ? { status: 'error' }
            : { status: 'loading' }
    state = { status: 'success', concern, replies: repliesState }
  }

  const retry = () => {
    if (!concern) void detail.refetch()
    else if (open.isError) open.mutate()
    else void replies.refetch()
  }

  return { state, retry }
}
