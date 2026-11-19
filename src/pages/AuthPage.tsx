import { useState } from 'react'
import type { FormEvent } from 'react'
import { BackButton, Button, Checkbox, TextField } from '@/shared/ui'
import { GoogleIdentityButton } from '@/features/auth'
import styles from './AuthPage.module.css'

export interface AuthPageProps {
  mode: 'login' | 'signup'
  onBack: () => void
  onSwitchMode: () => void
  onContinue: (values: { email: string; password: string }) => void | Promise<void>
  onGoogleCredential: (credential: string) => void
  googleLoading: boolean
  googleError: string
  authLoading: boolean
  authError: string
}

export default function AuthPage({
  mode,
  onBack,
  onSwitchMode,
  onContinue,
  onGoogleCredential,
  googleLoading,
  googleError,
  authLoading,
  authError,
}: AuthPageProps) {
  const [remember, setRemember] = useState(false)
  const isSignup = mode === 'signup'
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSignup) return
    const form = new FormData(event.currentTarget)
    onContinue({ email: String(form.get('email') ?? '').trim(), password: String(form.get('password') ?? '') })
  }

  return (
    <main className={styles.page} aria-label={isSignup ? '회원가입' : '로그인'}>
      <div className={styles.topBar}>
        <BackButton className={styles.back} aria-label="뒤로 가기" onClick={onBack} />
      </div>

      <header className={styles.heading}>
        <h1>{isSignup ? '회원가입' : '로그인'}</h1>
        <p>{isSignup ? '계정을 만들어주세요' : '계속하려면 로그인하세요'}</p>
      </header>

      {/* 위·아래 두 빈칸이 화면 높이에 따라 늘고 준다(시안 852 기준 95 : 147) */}
      <div className={styles.spacerTop} aria-hidden="true" />

      <div className={styles.googleArea} aria-busy={googleLoading}>
        {googleClientId ? (
          <GoogleIdentityButton
            clientId={googleClientId}
            onCredential={onGoogleCredential}
            disabled={googleLoading}
          />
        ) : (
          <p className={styles.googleError} role="status">Google Client ID 설정이 필요해요.</p>
        )}
        {googleLoading && <p className={styles.googleLoading} role="status">Google 로그인 중...</p>}
        {googleError && <p className={styles.googleError} role="alert">{googleError}</p>}
      </div>
      <p className={styles.divider}>또는</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <TextField
          className={styles.email}
          label="이메일"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="이메일을 입력해주세요"
          required
        />
        <TextField
          className={styles.password}
          label="비밀번호"
          type="password"
          name="password"
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          placeholder="비밀번호를 입력해주세요"
          hint="8자 이상, 대문자 포함, 숫자 포함, 특수문자 포함"
          minLength={isSignup ? 8 : undefined}
          required
        />
        <Checkbox
          className={styles.remember}
          shape="round"
          checked={remember}
          onChange={(event) => setRemember(event.currentTarget.checked)}
        >
          로그인 유지하기
        </Checkbox>

        <div className={styles.spacerBottom} aria-hidden="true" />

        {isSignup && <p className={styles.signupNotice} role="status">이메일 인증 회원가입은 준비 중이에요. Google로 가입해 주세요.</p>}
        {authError && <p className={styles.googleError} role="alert">{authError}</p>}
        <Button className={styles.submit} variant="primary" size="lg" fullWidth type="submit" disabled={authLoading || isSignup}>
          {isSignup ? '회원가입' : '로그인'}
        </Button>
      </form>

      <p className={styles.footer}>
        <span>{isSignup ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}</span>
        <button type="button" onClick={onSwitchMode}>
          {isSignup ? '로그인' : '회원가입'}
        </button>
      </p>
    </main>
  )
}
