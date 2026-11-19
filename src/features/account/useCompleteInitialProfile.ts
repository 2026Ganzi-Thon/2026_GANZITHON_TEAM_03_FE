import { useMutation } from '@tanstack/react-query'
import { completeInitialProfile } from './accountApi'
import type { InitialProfileRequest } from './types'

export type CompleteInitialProfileState = { status: 'idle' } | { status: 'submitting' } | { status: 'error' } | { status: 'success' }

/**
 * 초기 프로필(닉네임 등)을 저장한다. 뒤의 이동은 쓰는 쪽 몫이다.
 * 홈 요약처럼 닉네임을 보여주는 캐시는 `app/queryClient.ts` 가 mutation 성공 때 다시 받게 한다(기능끼리 import 금지).
 */
export function useCompleteInitialProfile() {
  const mutation = useMutation({ mutationFn: completeInitialProfile })

  const state: CompleteInitialProfileState =
    mutation.status === 'pending'
      ? { status: 'submitting' }
      : mutation.status === 'success'
        ? { status: 'success' }
        : mutation.status === 'error'
          ? { status: 'error' }
          : { status: 'idle' }

  /**
   * 저장하고 결과를 돌려준다. 저장 중에 다시 부르면 무시한다(`ok: false`, error 없음).
   * 실패하면 오류를 함께 준다 — 닉네임 중복 409 `USER_NICKNAME_DUPLICATED`, 형식 400 `COMMON_INVALID_REQUEST`.
   */
  const submit = async (body: InitialProfileRequest): Promise<{ ok: true } | { ok: false; error?: unknown }> => {
    if (mutation.isPending) return { ok: false }
    try {
      await mutation.mutateAsync(body)
      return { ok: true }
    } catch (error) {
      return { ok: false, error }
    }
  }

  return { state, submit }
}
