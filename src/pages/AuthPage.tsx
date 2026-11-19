import { useState } from 'react'
import type { FormEvent } from 'react'
import { BackButton, Button, Checkbox, TextField } from '@/shared/ui'
import { GoogleIdentityButton, PASSWORD_RULE_TEXT, VERIFICATION_LINK_MINUTES, useVerificationMail } from '@/features/auth'
import styles from './AuthPage.module.css'

export interface AuthPageProps {
  mode: 'login' | 'signup'
  onBack: () => void
  onSwitchMode: () => void
  /** 로그인 제출 */
  onContinue: (values: { email: string; password: string }) => void | Promise<void>
  onGoogleCredential: (credential: string) => void
  googleLoading: boolean
  googleError: string
  authLoading: boolean
  authError: string
  /** 회원가입: 처음 채워 둘 이메일(인증 메일 다시 받기로 왔을 때) */
  initialEmail?: string
  /** 회원가입: 위에 띄울 안내(링크 만료 등으로 다시 받으러 왔을 때) */
  signupNotice?: string
  /** 로그인: 위에 띄울 안내(비밀번호를 바꾼 뒤 등) */
  loginNotice?: string
  /** 로그인: 비밀번호 찾기 — 입력해 둔 이메일을 넘긴다 */
  onForgotPassword?: (email: string) => void
}

export default function AuthPage(props: AuthPageProps) {
  const { mode, onBack, onSwitchMode, onGoogleCredential, googleLoading, googleError } = props
  const isSignup = mode === 'signup'
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

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

      {isSignup ? <SignupEmailForm {...props} /> : <LoginForm {...props} />}

      <p className={styles.footer}>
        <span>{isSignup ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}</span>
        <button type="button" onClick={onSwitchMode}>
          {isSignup ? '로그인' : '회원가입'}
        </button>
      </p>
    </main>
  )
}

function LoginForm({ onContinue, authLoading, authError, loginNotice, onForgotPassword }: AuthPageProps) {
  const [remember, setRemember] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    void onContinue({ email: String(form.get('email') ?? '').trim(), password: String(form.get('password') ?? '') })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {loginNotice && (
        <p className={styles.noticeOk} role="status">
          {loginNotice}
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
        onChange={(event) => setEmail(event.currentTarget.value)}
        required
      />
      <TextField
        className={styles.password}
        label="비밀번호"
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="비밀번호를 입력해주세요"
        // 시안 0-4 안내 그대로. 로그인은 규칙을 검사하지 않는다(서버도 가입 당시 비밀번호와 그대로 비교)
        hint={PASSWORD_RULE_TEXT}
        required
      />
      {/* 임의 결정(확인 필요): 로그인 유지는 서버 Refresh 쿠키(14일)로 항상 유지돼 체크 여부를 보내지 않음(PR #17 그대로) */}
      <div className={styles.rememberRow}>
        <Checkbox
          className={styles.remember}
          shape="round"
          checked={remember}
          onChange={(event) => setRemember(event.currentTarget.checked)}
        >
          로그인 유지하기
        </Checkbox>
        {/* 시안 0-4 옆에 놓인 "비밀번호 찾기" 글자(49:139) — 프레임 밖에 떠 있어 자리는 임의 결정(확인 필요): 로그인 유지하기 줄 오른쪽 */}
        {onForgotPassword && (
          <button type="button" className={styles.forgot} onClick={() => onForgotPassword(email.trim())}>
            비밀번호 찾기
          </button>
        )}
      </div>

      <div className={styles.spacerBottom} aria-hidden="true" />

      {authError && <p className={styles.googleError} role="alert">{authError}</p>}
      <Button className={styles.submit} variant="primary" size="lg" fullWidth type="submit" disabled={authLoading}>
        로그인
      </Button>
    </form>
  )
}

/**
 * 회원가입 첫 단계: 이메일만 받아 인증 메일을 보낸다.
 * 임의 결정(확인 필요): 시안 0-4 회원가입은 이메일·비밀번호를 한 화면에서 받지만, 메일 링크가 다른 탭·앱(메일 앱 → Safari)에서
 * 열릴 수 있어 비밀번호는 메일 링크를 연 뒤(/verify-email)에 받는다 — 비밀번호를 저장해 두고 넘기지 않기 위해.
 */
function SignupEmailForm({ initialEmail = '', signupNotice }: AuthPageProps) {
  const mail = useVerificationMail()
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
      ? `${mail.sentTo ? '다시 보내기' : '인증 메일 보내기'} (${wait}초)`
      : mail.sentTo
        ? '인증 메일 다시 보내기'
        : '인증 메일 보내기'

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {signupNotice && !mail.sentTo && <p className={styles.notice} role="status">{signupNotice}</p>}
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
        hint={mail.sentTo ? undefined : '인증 메일의 링크를 열면 비밀번호를 정할 수 있어요'}
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
        // 임의 결정(확인 필요): 메일 확인 안내는 시안에 없어 같은 화면 아래에 상자로 보여줌(초기 설정의 약관 상자와 같은 톤)
        <section className={styles.mailSent} aria-live="polite">
          <h2>메일함을 확인해주세요</h2>
          <p>
            <strong>{mail.sentTo}</strong>(으)로 인증 메일을 보냈어요. 메일의 링크를 {VERIFICATION_LINK_MINUTES}분 안에 열면
            비밀번호를 정할 수 있어요.
          </p>
          <p className={styles.mailSentHint}>메일이 보이지 않으면 스팸함도 확인해주세요. 다시 보내면 이전 링크는 쓸 수 없어요.</p>
        </section>
      )}

      <div className={styles.spacerBottom} aria-hidden="true" />

      {mail.error && <p className={styles.googleError} role="alert">{mail.error}</p>}
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
  )
}
