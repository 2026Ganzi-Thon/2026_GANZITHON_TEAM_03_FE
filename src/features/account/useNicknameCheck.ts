import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/shared/api'
import { isValidNickname, normalizeNickname } from './nickname'
import { COMMON_INVALID_REQUEST } from './profileApi'
import { nicknameAvailabilityQueryOptions } from './profileQueries'
import type { NicknameCheckState } from './types'

/**
 * 닉네임 중복 확인(버튼을 누를 때만). 형식이 틀리면 서버에 묻지 않고 바로 `invalid`.
 * 입력이 바뀌면 쓰는 쪽이 `reset` 한다 — 확인 중에 입력이 바뀌면 늦게 온 결과는 버린다.
 */
export function useNicknameCheck() {
  const queryClient = useQueryClient()
  const [state, setState] = useState<NicknameCheckState>({ status: 'idle' })
  /** 마지막 확인 요청 번호. reset·새 확인마다 올려서 늦게 온 응답을 버린다 */
  const requestRef = useRef(0)

  const reset = () => {
    requestRef.current += 1
    setState({ status: 'idle' })
  }

  /** 확인하고 결과 상태를 돌려준다(버려진 요청이면 null). */
  const check = async (nickname: string): Promise<NicknameCheckState | null> => {
    const request = ++requestRef.current
    const finish = (next: NicknameCheckState) => {
      if (request !== requestRef.current) return null
      setState(next)
      return next
    }

    if (!isValidNickname(nickname)) return finish({ status: 'invalid' })
    setState({ status: 'checking' })
    try {
      const result = await queryClient.fetchQuery(nicknameAvailabilityQueryOptions(normalizeNickname(nickname)))
      return finish(result.available ? { status: 'available' } : { status: 'taken' })
    } catch (error) {
      return finish(hasErrorCode(error, COMMON_INVALID_REQUEST) ? { status: 'invalid' } : { status: 'error' })
    }
  }

  /** 저장이 409(중복)·400(형식)으로 실패했을 때 — 확인 결과를 그 내용으로 바꾼다 */
  const markFailed = (status: 'taken' | 'invalid') => {
    requestRef.current += 1
    setState({ status })
  }

  return { state, check, reset, markFailed }
}
