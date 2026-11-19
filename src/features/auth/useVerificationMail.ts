import { useEffect, useState } from 'react'
import { hasErrorCode } from '@/shared/api'
import { verificationMailErrorMessage } from './authErrors'
import { sendVerificationEmail } from './emailSignupApi'
import { rememberSentEmail } from './signupDraft'

/** 같은 이메일 재발송 간격(서버 60초) */
export const RESEND_COOLDOWN_SECONDS = 60

/** 메일 링크 유효시간(서버 30분) — 안내 문구용 */
export const VERIFICATION_LINK_MINUTES = 30

/**
 * 인증 메일 보내기 + 다시 보내기 대기(60초).
 * 보낸 이메일(`sentTo`)이 있으면 "메일함을 확인해 주세요" 단계. 429 를 받아도 대기를 다시 건다.
 */
export function useVerificationMail() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [cooldownUntil, setCooldownUntil] = useState(0)
  /** 대기 중인 이메일 — 같은 이메일만 60초 막는다(다른 이메일은 바로 보낼 수 있음, IP 상한은 서버가 429) */
  const [cooldownEmail, setCooldownEmail] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const timer = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= cooldownUntil) window.clearInterval(timer)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldownUntil])

  const remainingSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

  const startCooldown = (email: string) => {
    const current = Date.now()
    setCooldownEmail(email)
    setNow(current)
    setCooldownUntil(current + RESEND_COOLDOWN_SECONDS * 1000)
  }

  /** 보내고 성공 여부를 돌려준다 */
  const send = async (email: string) => {
    if (sending) return false
    setSending(true)
    setError('')
    try {
      await sendVerificationEmail(email)
      setSentTo(email)
      rememberSentEmail(email)
      startCooldown(email)
      return true
    } catch (caught) {
      setError(verificationMailErrorMessage(caught))
      if (hasErrorCode(caught, 'AUTH_RATE_LIMITED')) startCooldown(email)
      return false
    } finally {
      setSending(false)
    }
  }

  /** 이 이메일로 지금 보낼 수 없으면 남은 초, 보낼 수 있으면 0 */
  const waitFor = (email: string) => (email === cooldownEmail ? remainingSeconds : 0)

  /** 이메일 바꾸기 — 입력 단계로 */
  const changeEmail = () => {
    setSentTo(null)
    setError('')
  }

  return { sentTo, sending, error, waitFor, send, changeEmail, clearError: () => setError('') }
}
