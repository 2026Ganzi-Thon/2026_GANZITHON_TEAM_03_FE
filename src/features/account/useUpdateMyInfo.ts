import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/shared/api'
import { COMMON_INVALID_REQUEST, USER_NICKNAME_DUPLICATED, updateMyInfo } from './profileApi'
import { applyProfile } from './profileQueries'
import type { UpdateMyInfoState, UpdateProfileRequest } from './types'

/**
 * 내 정보를 수정한다(바뀐 항목만 넘긴다). 성공하면 내 정보 캐시에 바로 반영한다.
 * 홈 요약처럼 닉네임을 보여주는 캐시는 `app/queryClient.ts` 가 mutation 성공 때 다시 받게 한다(기능끼리 import 금지).
 */
export function useUpdateMyInfo() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: updateMyInfo,
    onSuccess: (profile) => applyProfile(queryClient, profile),
  })

  const state: UpdateMyInfoState =
    mutation.status === 'pending'
      ? { status: 'submitting' }
      : mutation.status === 'success'
        ? { status: 'success' }
        : mutation.status === 'error'
          ? hasErrorCode(mutation.error, USER_NICKNAME_DUPLICATED)
            ? { status: 'duplicated' }
            : hasErrorCode(mutation.error, COMMON_INVALID_REQUEST)
              ? { status: 'invalid' }
              : { status: 'error' }
          : { status: 'idle' }

  /** 저장하고 결과 상태를 돌려준다. 저장 중에 다시 부르면 무시한다(null). */
  const submit = async (body: UpdateProfileRequest): Promise<UpdateMyInfoState | null> => {
    if (mutation.isPending) return null
    try {
      await mutation.mutateAsync(body)
      return { status: 'success' }
    } catch (error) {
      if (hasErrorCode(error, USER_NICKNAME_DUPLICATED)) return { status: 'duplicated' }
      if (hasErrorCode(error, COMMON_INVALID_REQUEST)) return { status: 'invalid' }
      return { status: 'error' }
    }
  }

  return { state, submit, reset: mutation.reset }
}
