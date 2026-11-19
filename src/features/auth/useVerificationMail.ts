import { useState } from 'react'
import { hasErrorCode } from '@/shared/api'
import { verificationMailErrorMessage } from './authErrors'
import { sendVerificationEmail } from './emailSignupApi'
import { rememberSentEmail } from './signupDraft'
import { useResendCooldown } from './useResendCooldown'

export { RESEND_COOLDOWN_SECONDS } from './useResendCooldown'

/** 메일 링크 유효시간(서버 30분) — 안내 문구용. 비밀번호 재설정 링크도 30분 */
export const VERIFICATION_LINK_MINUTES = 30

/**
 * 인증 메일 보내기 + 다시 보내기 대기(60초).
 * 보낸 이메일(`sentTo`)이 있으면 "메일함을 확인해 주세요" 단계. 429 를 받아도 대기를 다시 건다.
 */
export function useVerificationMail() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const cooldown = useResendCooldown()

  /** 보내고 성공 여부를 돌려준다 */
  const send = async (email: string) => {
    if (sending) return false
    setSending(true)
    setError('')
    try {
      await sendVerificationEmail(email)
      setSentTo(email)
      rememberSentEmail(email)
      cooldown.start(email)
      return true
    } catch (caught) {
      setError(verificationMailErrorMessage(caught))
      if (hasErrorCode(caught, 'AUTH_RATE_LIMITED')) cooldown.start(email)
      return false
    } finally {
      setSending(false)
    }
  }

  /** 이메일 바꾸기 — 입력 단계로 */
  const changeEmail = () => {
    setSentTo(null)
    setError('')
  }

  return { sentTo, sending, error, waitFor: cooldown.waitFor, send, changeEmail, clearError: () => setError('') }
}
