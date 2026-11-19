import { useState } from 'react'
import { hasErrorCode } from '@/shared/api'
import { passwordResetMailErrorMessage } from './authErrors'
import { requestPasswordReset } from './passwordResetApi'
import { useResendCooldown } from './useResendCooldown'

/**
 * 비밀번호 재설정 메일 요청 + 다시 보내기 대기(60초). 인증 메일(useVerificationMail)과 같은 흐름.
 * 서버는 가입 여부와 상관없이 같은 202 를 주므로 `sentTo` 는 "요청을 받았다"는 뜻이다(메일이 갔다는 뜻이 아니다).
 */
export function usePasswordResetMail() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  /** 503 — 메일을 보낼 수 없는 상태. 안내를 따로 보여준다 */
  const [unavailable, setUnavailable] = useState(false)
  const cooldown = useResendCooldown()

  const send = async (email: string) => {
    if (sending) return false
    setSending(true)
    setError('')
    setUnavailable(false)
    try {
      await requestPasswordReset(email)
      setSentTo(email)
      cooldown.start(email)
      return true
    } catch (caught) {
      setError(passwordResetMailErrorMessage(caught))
      setUnavailable(hasErrorCode(caught, 'AUTH_MAIL_UNAVAILABLE'))
      if (hasErrorCode(caught, 'AUTH_RATE_LIMITED')) cooldown.start(email)
      return false
    } finally {
      setSending(false)
    }
  }

  const changeEmail = () => {
    setSentTo(null)
    setError('')
    setUnavailable(false)
  }

  const clearError = () => {
    setError('')
    setUnavailable(false)
  }

  return { sentTo, sending, error, unavailable, waitFor: cooldown.waitFor, send, changeEmail, clearError }
}
