import { useEffect, useState } from 'react'

/** 같은 이메일 재발송 간격(서버 60초) — 인증 메일·재설정 메일 모두 */
export const RESEND_COOLDOWN_SECONDS = 60

/**
 * 같은 이메일로 다시 보내기 전 대기(60초). 다른 이메일은 바로 보낼 수 있다(IP 상한은 서버가 429).
 * `waitFor(email)` 은 그 이메일로 지금 보낼 수 없으면 남은 초, 보낼 수 있으면 0.
 */
export function useResendCooldown() {
  const [cooldownUntil, setCooldownUntil] = useState(0)
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

  const start = (email: string) => {
    const current = Date.now()
    setCooldownEmail(email)
    setNow(current)
    setCooldownUntil(current + RESEND_COOLDOWN_SECONDS * 1000)
  }

  const waitFor = (email: string) => (email === cooldownEmail ? remainingSeconds : 0)

  return { start, waitFor }
}
