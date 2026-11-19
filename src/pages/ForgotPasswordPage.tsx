import { useState } from 'react'
import type { FormEvent } from 'react'
import { BackButton, Button, TextField } from '@/shared/ui'
import { VERIFICATION_LINK_MINUTES, usePasswordResetMail } from '@/features/auth'
import styles from './PasswordResetPage.module.css'

// 임의 결정(확인 필요): 비밀번호 찾기 화면은 시안에 없어 0-4 로그인·회원가입 이메일 단계와 같은 틀·문구 톤으로 만듦

export interface ForgotPasswordPageProps {
  onBack: () => void
  onLogin: () => void
  /** 로그인 화면에서 입력하던 이메일 */
  initialEmail?: string
  /** 위에 띄울 안내(재설정 링크 만료 등으로 다시 받으러 왔을 때) */
  notice?: string
}

/**
 * 비밀번호 찾기 — 가입한 이메일로 재설정 링크를 요청한다(`POST /auth/password-resets`).
 * 서버는 가입 여부를 알려 주지 않아(항상 같은 202) "가입된 이메일이면 메일이 가요"로 안내한다.
 */
export default function ForgotPasswordPage({ onBack, onLogin, initialEmail = '', notice }: ForgotPasswordPageProps) {
  const mail = usePasswordResetMail()
  const [email, setEmail] = useState(initialEmail)
  const trimmed = email.trim()
  const wait = mail.waitFor(trimmed)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!trimmed || wait > 0) return
    void mail.send(trimmed)
  }

  const submitLabel = mail.sending
    ? '보내는 중...'
    : wait > 0
      ? `다시 보내기 (${wait}초)`
      : mail.sentTo
        ? '재설정 메일 다시 보내기'
        : '재설정 메일 보내기'

  return (
    <main className={styles.page} aria-label="비밀번호 찾기">
      <div className={styles.topBar}>
        <BackButton className={styles.back} aria-label="뒤로 가기" onClick={onBack} />
      </div>

      <header className={styles.heading}>
        <h1>비밀번호 찾기</h1>
        <p>가입한 이메일로 재설정 링크를 보내드려요</p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {notice && !mail.sentTo && (
          <p className={styles.error} role="status">
            {notice}
          </p>
        )}
        <TextField
          className={styles.email}
          label="이메일"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="이메일을 입력해주세요"
          value={email}
          readOnly={Boolean(mail.sentTo)}
          onChange={(event) => {
            setEmail(event.currentTarget.value)
            mail.clearError()
          }}
          endAdornment={
            mail.sentTo ? (
              <Button type="button" variant="primary" size="sm" className={styles.changeEmail} onClick={mail.changeEmail}>
                이메일 바꾸기
              </Button>
            ) : undefined
          }
          required
        />

        {mail.sentTo && (
          // 임의 결정(확인 필요): 서버가 가입 여부를 숨기므로(항상 202) "가입된 이메일이면" 조건을 붙여 안내
          <section className={styles.box} aria-live="polite">
            <h2>메일함을 확인해주세요</h2>
            <p>
              <strong>{mail.sentTo}</strong>(으)로 가입한 계정이 있으면 비밀번호 재설정 메일을 보냈어요. 메일의 링크를{' '}
              {VERIFICATION_LINK_MINUTES}분 안에 열어 새 비밀번호를 정해주세요.
            </p>
            <p className={styles.boxHint}>
              Google로 가입한 계정은 비밀번호가 없어 메일이 가지 않아요. 로그인 화면에서 Google로 계속하기를 눌러주세요.
              다시 보내면 이전 링크는 쓸 수 없어요.
            </p>
          </section>
        )}

        {mail.unavailable && (
          // 503 AUTH_MAIL_UNAVAILABLE — 배포 서버 SMTP 설정 전이라 지금은 이 안내가 나온다
          <section className={styles.box} role="status">
            <h2>지금은 메일을 보낼 수 없어요</h2>
            <p>메일 서버를 점검하고 있어요. 잠시 후 다시 시도해주세요.</p>
            <p className={styles.boxHint}>Google로 가입했다면 비밀번호 없이 Google로 계속하기로 로그인할 수 있어요.</p>
          </section>
        )}

        <div className={styles.grow} />

        <p className={styles.error} role="alert">
          {mail.unavailable ? '' : mail.error}
        </p>
        <Button
          className={styles.submit}
          variant="primary"
          size="lg"
          fullWidth
          type="submit"
          disabled={mail.sending || !trimmed || wait > 0}
        >
          {submitLabel}
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
