import { useQuery } from '@tanstack/react-query'
import { myInfoQueryOptions } from './profileQueries'
import type { MyInfoState } from './types'

/** 내 정보(설정 화면). 받아 둔 값이 없을 때 실패하면 `retry` 로 다시 시도한다. */
export function useMyInfo() {
  const { data, isError, refetch } = useQuery(myInfoQueryOptions())

  const state: MyInfoState = data
    ? { status: 'success', data }
    : isError
      ? { status: 'error' }
      : { status: 'loading' }

  return { state, retry: () => void refetch() }
}
