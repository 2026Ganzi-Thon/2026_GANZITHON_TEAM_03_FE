import { useState } from 'react'
import type { FormEvent } from 'react'
import { BackButton, Button, TextField } from '@/shared/ui'
import { PASSWORD_MAX_LENGTH, PASSWORD_RULES, checkPassword, isValidPassword, usePasswordReset } from '@/features/auth'
import { cx } from '@/shared/lib/cx'
import styles from './PasswordResetPage.module.css'

// 임의 결정(확인 필요): 재설정 화면은 시안에 없어 이메일 가입의 비밀번호 화면(VerifyEmailPage)과 같은 틀·규칙 안내로 만듦

type LinkFailure = 'expired' | 'used' | 'invalid' | 'missing'

const failureCopy: Record<LinkFailure, { title: string; body: string }> = {
  expired: { title: '재설정 링크가 만료됐어요', body: '링크는 30분 동안만 쓸 수 있어요. 재설정 메일을 다시 받아주세요.' },
  used: {
    title: '이미 사용한 재설정 링크예요',
    body: '비밀번호를 이미 바꿨거나, 메일을 다시 받아 이전 링크가 막혔어요. 가장 최근 메일의 링크를 열거나 재설정 메일을 다시 받아주세요.',
  },
  invalid: { title: '올바르지 않은 재설정 링크예요', body: '메일의 링크를 끝까지 그대로 열었는지 확인하거나, 재설정 메일을 다시 받아주세요.' },
  missing: { title: '재설정 정보가 없어요', body: '메일의 재설정 링크로 다시 들어오거나, 재설정 메일을 다시 받아주세요.' },
}

export interface ResetPasswordPageProps {
  /** 메일 링크의 토큰(주소창에서는 이미 지웠다). 없으면 링크 없음 안내 */
  token: string | null
  onBack: () => void
  /** 재설정 메일 다시 받기(비밀번호 찾기 화면으로) */
  onRequestAgain: (reason: LinkFailure) => void
  /** 바꾼 뒤 — 로그인 화면으로(자동 로그인 없음, 서버가 기존 세션을 모두 끊음) */
  onDone: () => void
  onLogin: () => void
}

/** 비밀번호 재설정(메일 링크 `/reset-password#token=…`) — 새 비밀번호를 받아 `PATCH /auth/password-resets`. */
export default function ResetPasswordPage({ token, onBack, onRequestAgain, onDone, onLogin }: ResetPasswordPageProps) {
  const reset = usePasswordReset(token)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const rules = checkPassword(password)
  const valid = isValidPassword(password)
  const mismatch = confirm.length > 0 && confirm !== password
  const submitting = reset.state.status === 'submitting' || reset.state.status === 'done'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (!valid || confirm !== password) return
    if (await reset.submit(password)) onDone()
  }

  const linkFailure: LinkFailure | null =
    reset.state.status === 'linkFailed' ? (token ? reset.state.reason : 'missing') : null

  if (linkFailure) {
    return (
      <main className={styles.page} aria-label="비밀번호 재설정">
        <div className={styles.topBar}>
          <BackButton className={styles.back} aria-label="뒤로 가기" onClick={onBack} />
        </div>
        <header className={styles.heading}>
          <h1>비밀번호 재설정</h1>
          <p>{failureCopy[linkFailure].title}</p>
        </header>
        <p className={styles.failure} role="alert">
          {failureCopy[linkFailure].body}
        </p>
        <div className={styles.grow} />
        <Button className={styles.submit} variant="primary" size="lg" fullWidth onClick={() => onRequestAgain(linkFailure)}>
          재설정 메일 다시 받기
        </Button>
        <p className={styles.footer}>
          <span>비밀번호가 생각나셨나요?</span>
          <button type="button" onClick={onLogin}>
            로그인
          </button>
        </p>
      </main>
    )
  }

  const failedMessage = reset.state.status === 'failed' ? reset.state.message : ''
  const policyFailed = reset.state.status === 'failed' && reset.state.reason === 'password'

  return (
    <main className={styles.page} aria-label="비밀번호 재설정">
      <div className={styles.topBar}>
        <BackButton className={styles.back} aria-label="뒤로 가기" onClick={onBack} />
      </div>

      <header className={styles.heading}>
        <h1>비밀번호 재설정</h1>
        <p>새 비밀번호를 정해주세요</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextField
          className={styles.field}
          label="새 비밀번호"
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="새 비밀번호를 입력해주세요"
          maxLength={PASSWORD_MAX_LENGTH}
          value={password}
          onChange={(event) => {
            setPassword(event.currentTarget.value)
            reset.clearFailure()
          }}
          error={(submitted && !valid) || policyFailed ? '비밀번호 규칙을 모두 지켜주세요.' : undefined}
          hint={
            <span className={styles.rules}>
              {PASSWORD_RULES.map((rule) => (
                <span key={rule.key} className={cx(styles.rule, rules[rule.key] && styles.ruleOk)}>
                  <span aria-hidden="true">{rules[rule.key] ? '✓' : '·'}</span> {rule.label}
                  <span className={styles.srOnly}>{rules[rule.key] ? ' 충족' : ' 미충족'}</span>
                </span>
              ))}
            </span>
          }
          required
        />
        <TextField
          className={styles.field}
          label="새 비밀번호 확인"
          type="password"
          name="new-password-confirm"
          autoComplete="new-password"
          placeholder="새 비밀번호를 한 번 더 입력해주세요"
          maxLength={PASSWORD_MAX_LENGTH}
          value={confirm}
          onChange={(event) => {
            setConfirm(event.currentTarget.value)
            reset.clearFailure()
          }}
          error={mismatch || (submitted && confirm !== password) ? '비밀번호가 일치하지 않아요.' : undefined}
          required
        />

        <div className={styles.grow} />

        <p className={styles.error} role="alert">
          {failedMessage}
        </p>
        <Button
          className={styles.submit}
          variant="primary"
          size="lg"
          fullWidth
          type="submit"
          disabled={submitting || !valid || !confirm || mismatch}
        >
          {submitting ? '바꾸는 중...' : '비밀번호 바꾸기'}
        </Button>
      </form>

      <p className={styles.footer}>
        <span>비밀번호가 생각나셨나요?</span>
        <button type="button" onClick={onLogin}>
          로그인
        </button>
      </p>
    </main>
  )
}
