import { useState } from 'react'
import { passwordResetErrorMessage, passwordResetFailureOf } from './authErrors'
import type { PasswordResetFailure } from './authErrors'
import { resetPassword } from './passwordResetApi'

export type PasswordResetState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'done' }
  /** 링크가 쓸 수 없음 — 메일을 다시 받아야 한다 */
  | { status: 'linkFailed'; reason: 'expired' | 'used' | 'invalid' }
  /** 규칙 위반(토큰은 그대로) 또는 네트워크 등 — 고쳐서 다시 보낼 수 있다 */
  | { status: 'failed'; reason: Extract<PasswordResetFailure, 'password' | 'error'>; message: string }

/**
 * 메일 링크의 토큰으로 새 비밀번호를 저장한다. 토큰은 메모리(쓰는 쪽 state)에만 둔다.
 * 확인 API 가 따로 없어 링크가 살아 있는지는 저장할 때 알게 된다.
 */
export function usePasswordReset(token: string | null) {
  const [state, setState] = useState<PasswordResetState>(() =>
    token ? { status: 'idle' } : { status: 'linkFailed', reason: 'invalid' },
  )

  const submit = async (newPassword: string) => {
    if (!token || state.status === 'submitting' || state.status === 'done') return false
    setState({ status: 'submitting' })
    try {
      await resetPassword({ token, newPassword })
      setState({ status: 'done' })
      return true
    } catch (error) {
      const failure = passwordResetFailureOf(error)
      if (failure === 'expired' || failure === 'used' || failure === 'invalid') {
        setState({ status: 'linkFailed', reason: failure })
      } else {
        setState({
          status: 'failed',
          reason: failure,
          message: failure === 'password' ? '비밀번호가 규칙에 맞지 않아요. 규칙을 확인해주세요.' : passwordResetErrorMessage(error),
        })
      }
      return false
    }
  }

  return { state, submit, clearFailure: () => state.status === 'failed' && setState({ status: 'idle' }) }
}
