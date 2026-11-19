import { useState } from 'react'
import type { FormEvent } from 'react'
import { BackButton, Button, TextField } from '@/shared/ui'
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_RULES,
  checkPassword,
  isValidPassword,
  setSignupPassword,
  useEmailConfirmation,
} from '@/features/auth'
import type { ConfirmFailure } from '@/features/auth'
import { cx } from '@/shared/lib/cx'
import styles from './VerifyEmailPage.module.css'

// 임의 결정(확인 필요): 이메일 인증·비밀번호 화면은 시안에 없어 0-4 회원가입(AuthPage)과 같은 틀·문구 톤으로 만듦

const failureCopy: Record<ConfirmFailure | 'missing', { title: string; body: string }> = {
  expired: { title: '인증 링크가 만료됐어요', body: '링크는 30분 동안만 쓸 수 있어요. 인증 메일을 다시 받아주세요.' },
  used: {
    title: '이미 사용한 인증 링크예요',
    body: '이 링크로는 다시 인증할 수 없어요. 메일을 여러 번 받았다면 가장 최근 메일의 링크를 열거나, 인증 메일을 다시 받아주세요.',
  },
  invalid: { title: '올바르지 않은 인증 링크예요', body: '메일의 링크를 끝까지 그대로 열었는지 확인하거나, 인증 메일을 다시 받아주세요.' },
  missing: { title: '인증 정보가 없어요', body: '메일의 인증 링크로 다시 들어오거나, 인증 메일을 다시 받아주세요.' },
  error: { title: '인증을 확인하지 못했어요', body: '네트워크 연결을 확인하고 다시 시도해주세요.' },
}

export interface VerifyEmailPageProps {
  /** 메일 링크의 토큰(주소창에서는 이미 지웠다). 없으면 메모리에 남은 가입 중 값을 이어 쓴다 */
  token: string | null
  onBack: () => void
  /** 인증 메일 다시 받기(회원가입 첫 화면으로) */
  onResend: (reason: ConfirmFailure | 'missing') => void
  /** 비밀번호를 정한 뒤 — 약관·닉네임 단계로 */
  onNext: () => void
  onLogin: () => void
}

export default function VerifyEmailPage({ token, onBack, onResend, onNext, onLogin }: VerifyEmailPageProps) {
  const { state, retry } = useEmailConfirmation(token)

  return (
    <main className={styles.page} aria-label="이메일 인증">
      <div className={styles.topBar}>
        <BackButton className={styles.back} aria-label="뒤로 가기" onClick={onBack} />
      </div>

      {state.status === 'confirming' && (
        <>
          <header className={styles.heading}>
            <h1>이메일 인증</h1>
            <p role="status">인증을 확인하고 있어요...</p>
          </header>
          <div className={styles.grow} />
        </>
      )}

      {state.status === 'failed' && (
        <>
          <header className={styles.heading}>
            <h1>이메일 인증</h1>
            <p>{failureCopy[state.reason].title}</p>
          </header>
          <p className={styles.failure} role="alert">{failureCopy[state.reason].body}</p>
          <div className={styles.grow} />
          {state.reason === 'error' && (
            <Button className={styles.secondary} variant="outline" size="lg" fullWidth onClick={retry}>
              다시 시도
            </Button>
          )}
          <Button className={styles.submit} variant="primary" size="lg" fullWidth onClick={() => onResend(state.reason)}>
            인증 메일 다시 받기
          </Button>
        </>
      )}

      {state.status === 'confirmed' && <PasswordForm email={state.email} onNext={onNext} />}

      <p className={styles.footer}>
        <span>이미 계정이 있으신가요?</span>
        <button type="button" onClick={onLogin}>로그인</button>
      </p>
    </main>
  )
}

function PasswordForm({ email, onNext }: { email: string; onNext: () => void }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const rules = checkPassword(password)
  const valid = isValidPassword(password)
  const mismatch = confirm.length > 0 && confirm !== password

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (!valid || confirm !== password) return
    setSignupPassword(password)
    onNext()
  }

  return (
    <>
      <header className={styles.heading}>
        <h1>회원가입</h1>
        <p>비밀번호를 정해주세요</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <TextField
          className={styles.field}
          label="이메일"
          type="email"
          name="username"
          // 비밀번호 관리자가 이 이메일을 아이디로 저장하게
          autoComplete="username"
          value={email}
          readOnly
          hint="인증된 이메일이에요"
        />
        <TextField
          className={styles.field}
          label="비밀번호"
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="비밀번호를 입력해주세요"
          maxLength={PASSWORD_MAX_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          error={submitted && !valid ? '비밀번호 규칙을 모두 지켜주세요.' : undefined}
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
          label="비밀번호 확인"
          type="password"
          name="new-password-confirm"
          autoComplete="new-password"
          placeholder="비밀번호를 한 번 더 입력해주세요"
          maxLength={PASSWORD_MAX_LENGTH}
          value={confirm}
          onChange={(event) => setConfirm(event.currentTarget.value)}
          error={mismatch || (submitted && confirm !== password) ? '비밀번호가 일치하지 않아요.' : undefined}
          required
        />

        <div className={styles.grow} />

        <Button className={styles.submit} variant="primary" size="lg" fullWidth type="submit" disabled={!valid || !confirm || mismatch}>
          다음
        </Button>
      </form>
    </>
  )
}
