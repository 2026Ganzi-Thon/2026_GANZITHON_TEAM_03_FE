import { useState } from 'react'
import type { FormEvent } from 'react'
import { BackButton } from '@/shared/ui/BackButton'
import { Button } from '@/shared/ui/Button'
import { Checkbox } from '@/shared/ui/Checkbox'
import { TextField } from '@/shared/ui/TextField'
import { GoogleIdentityButton } from '@/features/auth'
import googleLogo from '@/assets/images/google-original.png'
import styles from './AuthPage.module.css'

export interface AuthPageProps {
  mode: 'login' | 'signup'
  onBack: () => void
  onSwitchMode: () => void
  onContinue: () => void
  onGoogleCredential: (credential: string) => void
  googleLoading: boolean
  googleError: string
}

export default function AuthPage({
  mode,
  onBack,
  onSwitchMode,
  onContinue,
  onGoogleCredential,
  googleLoading,
  googleError,
}: AuthPageProps) {
  const [remember, setRemember] = useState(false)
  const isSignup = mode === 'signup'
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onContinue()
  }

  return (
    <main className={styles.page} aria-label={isSignup ? '회원가입' : '로그인'}>
      <BackButton className={styles.back} aria-label="뒤로 가기" onClick={onBack} />

      <header className={styles.heading}>
        <h1>{isSignup ? '회원가입' : '로그인'}</h1>
        <p>{isSignup ? '계정을 만들어주세요' : '계속하려면 로그인하세요'}</p>
      </header>

      <div className={styles.googleArea} aria-busy={googleLoading}>
        {googleClientId ? (
          <GoogleIdentityButton
            clientId={googleClientId}
            onCredential={onGoogleCredential}
            disabled={googleLoading}
          />
        ) : (
          <button type="button" className={styles.google} disabled>
            <img className={styles.googleMark} src={googleLogo} alt="" aria-hidden="true" />
            <span>Google로 계속하기</span>
          </button>
        )}
        {googleLoading && <p className={styles.googleLoading} role="status">Google 로그인 중...</p>}
        {googleError && <p className={styles.googleError} role="alert">{googleError}</p>}
        {!googleClientId && <p className={styles.googleError} role="status">Google Client ID 설정이 필요해요.</p>}
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
          minLength={8}
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

        <Button className={styles.submit} variant="primary" size="lg" fullWidth type="submit">
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
