import { useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Navigate, Outlet, ScrollRestoration, useLocation, useNavigate, useOutletContext, useParams } from 'react-router'
import AuthPage from '@/pages/AuthPage'
import CavePage from '@/pages/CavePage'
import CaveSessionPage from '@/pages/CaveSessionPage'
import CheesePage from '@/pages/CheesePage'
import CheeseVaultPage from '@/pages/CheeseVaultPage'
import ConcernDetailPage from '@/pages/ConcernDetailPage'
import ConcernWritePage from '@/pages/ConcernWritePage'
import EmotionPage from '@/pages/EmotionPage'
import EmotionRecordPage from '@/pages/EmotionRecordPage'
import EmotionWritePage from '@/pages/EmotionWritePage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import HomePage from '@/pages/HomePage'
import InitialSetupPage from '@/pages/InitialSetupPage'
import IslandDecoratePage from '@/pages/IslandDecoratePage'
import MyConcernDetailPage from '@/pages/MyConcernDetailPage'
import OnboardingPage from '@/pages/OnboardingPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import SettingsPage from '@/pages/SettingsPage'
import SplashPage from '@/pages/SplashPage'
import VerifyEmailPage from '@/pages/VerifyEmailPage'
import WoolCollectionPage from '@/pages/WoolCollectionPage'
import WoolHistoryPage from '@/pages/WoolHistoryPage'
import { useWoolBalance } from '@/shared/wool'
import {
  getResendEmail,
  getSignupDraft,
  isGoogleSignupConsentRequired,
  isSignupDraftExpired,
  loginErrorMessage,
  markSignedUp,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  signupErrorMessage,
  signupFailureMessages,
  signupFailureOf,
} from '@/features/auth'
import { fetchNicknameAvailability } from '@/features/account'
import type { CheeseTab } from '@/features/cheese'
import { getAccessToken, hasErrorCode } from '@/shared/api'
import type { InitialSetupValues } from '@/pages/InitialSetupPage'
import AppTabBar from './AppTabBar'
import { hasSeenOnboarding, markOnboardingSeen } from './entry'
import { closeSessionAfterPasswordReset, finishOnboarding, getSession, logout, openSession, useSession } from './session'

// 라우트 요소: 페이지의 콜백 props 를 useNavigate·useParams 로 경로에 연결한다(페이지는 react-router 를 모른다).
// 끝난 화면(스플래시 종료·온보딩 완료·로그인 완료·저장·삭제·위로 완료)에서의 이동은 replace — 브라우저 뒤로가기가 끝난 화면으로 돌아가지 않게.

// 양털 잔액은 공용 조회(`@/shared/wool`) 하나 — 홈 요약의 woolBalance 와 같은 값. 앱 시작 때 미리 받아 두고(App.tsx),
// 아직 못 받았으면 undefined 를 내려 숫자 자리에 막대를 보여준다(틀린 숫자를 잠깐이라도 보이지 않게).

/** 모든 화면의 바깥. 새 화면으로 가면 맨 위로, 뒤로·앞으로 가기는 그 화면의 스크롤 위치를 되돌린다. */
export function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}

// ── 시작 흐름 ────────────────────────────────────────────

/**
 * 스플래시가 끝나면 로그인 세션(./session.ts)에 따라: 앱 화면 / 초기 설정 / 온보딩.
 * 쿠키로 복원하는 중이면 끝날 때까지 스플래시 마지막 화면(사라진 뒤의 배경)에서 기다린다.
 */
export function SplashRoute() {
  const navigate = useNavigate()
  const session = useSession()
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done || session.status === 'restoring') return
    if (session.status === 'ready') navigate('/', { replace: true })
    else if (session.status === 'needsSetup') navigate('/setup', { replace: true, state: { requiresConsent: false } })
    // 이 기기에서 온보딩을 본 적이 있으면(로그인 전에 봤거나 서버에 완료로 저장된 계정으로 로그인했던 기기) 로그인으로
    else navigate(hasSeenOnboarding() ? '/login' : '/onboarding', { replace: true })
  }, [done, session.status, navigate])
  return <SplashPage onComplete={() => setDone(true)} />
}

export function OnboardingRoute() {
  const navigate = useNavigate()
  return (
    <OnboardingPage
      onComplete={() => {
        // 완료·건너뛰기 모두 완료로 본다. 로그인돼 있으면(로그인 뒤 처음 보는 계정) 서버에도 저장하고 앱 화면으로,
        // 로그인 전이면 이 기기에만 적어 두고 로그인 뒤에 서버에 저장한다(session.ts openSession)
        const status = getSession().status
        if (status === 'ready' || status === 'needsSetup') {
          finishOnboarding()
          navigate('/', { replace: true })
          return
        }
        markOnboardingSeen()
        // 임의 결정(확인 필요): 온보딩도 끝난 화면으로 보고 replace. 로그인의 뒤로 버튼은 그대로 /onboarding 으로 간다
        navigate('/login', { replace: true })
      }}
    />
  )
}

/** 회원가입 첫 화면(/signup)·로그인·비밀번호 찾기로 올 때의 state — 이메일·안내를 채운다 */
interface SignupRouteState {
  email?: string
  notice?: string
}

function AuthRoute({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as SignupRouteState | null
  const signupState = mode === 'signup' ? routeState : null
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')
  // 구글 로그인이 실패하면 올린다 — 버튼이 새 challenge 로 다시 준비돼 바로 다시 누를 수 있다
  const [googleRetryKey, setGoogleRetryKey] = useState(0)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const handleGoogleCredential = async (credential: string) => {
    setGoogleLoading(true)
    setGoogleError('')
    try {
      const result = await signInWithGoogle(credential)
      openSession(result.user.profileCompleted, result.user.onboardingCompleted)
      if (result.isNewUser) {
        navigate('/setup', { state: { googleCredential: credential, requiresConsent: false } })
      } else if (!result.user.profileCompleted) {
        navigate('/setup', { state: { requiresConsent: false } })
      } else {
        navigate('/', { replace: true })
      }
    } catch (error) {
      if (isGoogleSignupConsentRequired(error)) {
        navigate('/setup', { state: { googleCredential: credential, requiresConsent: true } })
      } else {
        setGoogleError(error instanceof Error ? error.message : 'Google 로그인을 완료하지 못했어요.')
        setGoogleRetryKey((key) => key + 1)
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleContinue = async ({ email, password }: { email: string; password: string }) => {
    setAuthError('')
    setAuthLoading(true)
    try {
      const result = await signInWithEmail(email, password)
      openSession(result.user.profileCompleted, result.user.onboardingCompleted)
      if (!result.user.profileCompleted) {
        navigate('/setup', { state: { requiresConsent: false } })
      } else {
        navigate('/', { replace: true })
      }
    } catch (error) {
      setAuthError(loginErrorMessage(error))
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <AuthPage
      // 다시 받기로 들어올 때마다 이메일 입력을 새로 채운다
      key={location.key}
      mode={mode}
      initialEmail={signupState?.email}
      signupNotice={signupState?.notice}
      loginNotice={mode === 'login' ? routeState?.notice : undefined}
      onForgotPassword={(email) => navigate('/forgot-password', { state: { email: email || undefined } satisfies SignupRouteState })}
      onBack={() => navigate(mode === 'login' ? '/onboarding' : '/login')}
      onSwitchMode={() => navigate(mode === 'login' ? '/signup' : '/login')}
      onGoogleCredential={handleGoogleCredential}
      googleLoading={googleLoading}
      googleError={googleError}
      googleRetryKey={googleRetryKey}
      authLoading={authLoading}
      authError={authError}
      onContinue={handleContinue}
    />
  )
}

export function LoginRoute() {
  return <AuthRoute mode="login" />
}

export function SignupRoute() {
  return <AuthRoute mode="signup" />
}

/** 다시 받으러 회원가입 첫 화면으로 — 알고 있는 이메일을 채워서 */
function resendState(notice: string): SignupRouteState {
  return { email: getResendEmail() || undefined, notice }
}

/**
 * 메일 링크(백엔드 FRONTEND_ORIGIN/verify-email#token=…). 토큰을 읽어 두고 주소창에서 바로 지운 뒤 확인 API 를 부른다.
 * 확인되면 비밀번호를 받고 초기 설정(약관·닉네임)으로. 비밀번호·가입 증명은 메모리(features/auth signupDraft)에만 둔다.
 */
export function VerifyEmailRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get('token'))

  useEffect(() => {
    // 토큰이 기록·화면 공유·새로고침에 남지 않게 주소에서 지운다(replace)
    if (location.hash) navigate({ pathname: location.pathname, search: location.search }, { replace: true })
  }, [location.hash, location.pathname, location.search, navigate])

  return (
    <VerifyEmailPage
      token={token}
      onBack={() => navigate('/signup')}
      onLogin={() => navigate('/login')}
      onResend={(reason) =>
        navigate('/signup', {
          state: resendState(
            reason === 'expired'
              ? '인증 링크가 만료됐어요. 인증 메일을 다시 받아주세요.'
              : reason === 'used'
                ? '이미 사용한 인증 링크예요. 인증 메일을 다시 받아주세요.'
                : '인증 메일을 다시 받아주세요.',
          ),
        })
      }
      onNext={() => navigate('/setup', { state: { emailSignup: true } satisfies SetupRouteState })}
    />
  )
}

/** 비밀번호 찾기 — 재설정 메일 요청. 로그인 화면의 "비밀번호 찾기"·재설정 링크 실패의 "다시 받기"로 온다 */
export function ForgotPasswordRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as SignupRouteState | null
  return (
    <ForgotPasswordPage
      key={location.key}
      initialEmail={routeState?.email}
      notice={routeState?.notice}
      onBack={() => (location.key === 'default' ? navigate('/login', { replace: true }) : navigate(-1))}
      onLogin={() => navigate('/login')}
    />
  )
}

/**
 * 비밀번호 재설정 메일 링크(백엔드 PASSWORD_RESET_FRONTEND_URL, 기본 FRONTEND_ORIGIN/reset-password#token=…).
 * 토큰은 읽자마자 주소창에서 지우고 메모리(state)에만 둔다. 바꾸면 이 기기 세션도 닫고(서버가 모든 세션을 끊음) 로그인 화면으로.
 */
export function ResetPasswordRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get('token'))

  useEffect(() => {
    if (location.hash) navigate({ pathname: location.pathname, search: location.search }, { replace: true })
  }, [location.hash, location.pathname, location.search, navigate])

  return (
    <ResetPasswordPage
      token={token}
      onBack={() => navigate('/login')}
      onLogin={() => navigate('/login')}
      onRequestAgain={(reason) =>
        navigate('/forgot-password', {
          state: {
            notice:
              reason === 'expired'
                ? '재설정 링크가 만료됐어요. 재설정 메일을 다시 받아주세요.'
                : reason === 'used'
                  ? '이미 사용한 재설정 링크예요. 재설정 메일을 다시 받아주세요.'
                  : '재설정 메일을 다시 받아주세요.',
          } satisfies SignupRouteState,
        })
      }
      onDone={() => {
        closeSessionAfterPasswordReset()
        navigate('/login', {
          replace: true,
          state: { notice: '비밀번호를 바꿨어요. 새 비밀번호로 로그인해주세요.' } satisfies SignupRouteState,
        })
      }}
    />
  )
}

interface SetupRouteState {
  /** 구글 신규 가입 — 약관 동의 뒤 같은 credential 로 다시 요청 */
  googleCredential?: string
  requiresConsent?: boolean
  /** 이메일 가입 — 비밀번호까지 받은 상태(메모리 signupDraft). 약관 동의와 함께 가입 → 초기 프로필 */
  emailSignup?: boolean
}

type SubmissionAction = { label: string; onClick: () => void }

export function SetupRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useSession()
  const [submissionError, setSubmissionError] = useState('')
  const [submissionAction, setSubmissionAction] = useState<SubmissionAction | undefined>()
  const [signingUp, setSigningUp] = useState(false)
  // 구글 가입은 됐는데 초기 설정 저장이 실패했을 때 다시 제출해도 가입(credential 재사용)을 또 부르지 않게
  const googleSignedUp = useRef(false)
  const routeState = location.state as SetupRouteState | null
  const draft = routeState?.emailSignup ? getSignupDraft() : null

  // 이메일 가입 중 값은 메모리에만 있어 새로고침하면 사라진다 — 이미 가입했으면(쿠키로 복원) 보통 초기 설정, 아니면 다시 받기로
  if (routeState?.emailSignup && !draft) {
    if (session.status === 'restoring') return null
    if (session.status !== 'needsSetup') {
      return <Navigate to="/signup" replace state={resendState('가입 정보가 사라졌어요. 인증 메일을 다시 받아주세요.')} />
    }
  }

  const fail = (message: string, action?: SubmissionAction) => {
    setSubmissionError(message)
    setSubmissionAction(action ? () => action : undefined)
  }

  const resendAction: SubmissionAction = {
    label: '인증 메일 다시 받기',
    onClick: () => navigate('/signup', { state: resendState('인증 메일을 다시 받아주세요.') }),
  }

  const signUpWithDraft = async (marketingAgreed: boolean) => {
    const current = getSignupDraft()
    if (!current) {
      fail('가입 정보가 사라졌어요. 인증 메일을 다시 받아주세요.', resendAction)
      return false
    }
    if (current.signedUp) return true
    if (!current.password) {
      fail('비밀번호를 먼저 정해주세요.', { label: '비밀번호 정하기', onClick: () => navigate('/verify-email') })
      return false
    }
    // 가입 증명(10분)이 지난 것을 알면 서버에 묻지 않고 바로 안내한다
    if (isSignupDraftExpired(current)) {
      fail(signupFailureMessages.verification, resendAction)
      return false
    }
    try {
      const result = await signUpWithEmail({
        email: current.email,
        password: current.password,
        signupVerificationToken: current.signupVerificationToken,
        consent: { termsAgreed: true, privacyAgreed: true, marketingAgreed },
      })
      markSignedUp()
      openSession(result.user.profileCompleted, result.user.onboardingCompleted)
      return true
    } catch (error) {
      const failure = signupFailureOf(error)
      fail(
        signupErrorMessage(error),
        failure === 'verification'
          ? resendAction
          : failure === 'duplicated'
            ? { label: '로그인', onClick: () => navigate('/login') }
            : failure === 'password'
              ? { label: '비밀번호 다시 정하기', onClick: () => navigate('/verify-email') }
              : undefined,
      )
      return false
    }
  }

  const signUpWithGoogleCredential = async (credential: string, marketingAgreed: boolean) => {
    if (googleSignedUp.current) return true
    try {
      const result = await signInWithGoogle(credential, { termsAgreed: true, privacyAgreed: true, marketingAgreed })
      googleSignedUp.current = true
      openSession(result.user.profileCompleted, result.user.onboardingCompleted)
      return true
    } catch (error) {
      // 약관을 입력하는 동안 challenge 유효시간(서버 5분)이 지나면 같은 credential 로는 가입할 수 없다 → 구글 로그인부터 다시
      if (hasErrorCode(error, 'AUTH_GOOGLE_CHALLENGE_INVALID') || hasErrorCode(error, 'AUTH_GOOGLE_TOKEN_INVALID')) {
        fail('구글 인증 시간이 지났어요. 구글로 다시 로그인해 주세요.', { label: '구글로 다시 로그인', onClick: () => navigate('/login') })
        return false
      }
      fail(error instanceof Error ? error.message : 'Google 회원가입을 완료하지 못했어요.')
      return false
    }
  }

  return (
    <InitialSetupPage
      onBack={() => navigate(draft && !draft.signedUp ? '/verify-email' : '/signup')}
      onLogin={() => navigate('/login')}
      // 닉네임 중복 확인은 토큰이 필요하다. 가입 전(이메일 가입·구글 신규 가입의 약관 동의 전)에는 확인을 미루고
      // 회원가입을 누를 때 초기 프로필 저장(409 USER_NICKNAME_DUPLICATED)으로 확인한다 — PR #17 의 401 실패 수정
      onCheckNickname={async (nickname) =>
        getAccessToken() ? (await fetchNicknameAvailability(nickname)).available : null
      }
      // 이메일 가입을 마친 뒤 새로고침했으면(가입 중 값 없음) 약관은 가입 때 이미 저장됨
      requiresConsent={draft ? true : routeState?.emailSignup ? false : (routeState?.requiresConsent ?? true)}
      submissionError={submissionError}
      submissionAction={submissionAction}
      isSubmitting={signingUp}
      onBeforeComplete={async (values: InitialSetupValues) => {
        const credential = routeState?.googleCredential
        const needsGoogleSignup = Boolean(credential && routeState?.requiresConsent)
        if (!draft && !needsGoogleSignup) return true
        setSubmissionError('')
        setSubmissionAction(undefined)
        setSigningUp(true)
        try {
          return draft
            ? await signUpWithDraft(values.consents.marketing)
            : await signUpWithGoogleCredential(credential!, values.consents.marketing)
        } finally {
          setSigningUp(false)
        }
      }}
      onComplete={() => {
        openSession(true)
        navigate('/', { replace: true })
      }}
    />
  )
}

// ── 앱 화면 ──────────────────────────────────────────────

interface CheeseListState {
  page: number
  selectedId: string | null
}

interface AppShellContext {
  cheeseList: CheeseListState
  setCheeseList: Dispatch<SetStateAction<CheeseListState>>
  /** 치즈 보관함의 현재 페이지 — 내 고민 상세에 다녀와도 유지 */
  vaultPage: number
  setVaultPage: Dispatch<SetStateAction<number>>
  /** 치즈 보관함의 탭(내 고민 / 보관한 치즈) — 내 고민 상세에 다녀와도 유지 */
  vaultTab: CheeseTab
  setVaultTab: Dispatch<SetStateAction<CheeseTab>>
}

/**
 * 앱 화면 공통 부모: 로그인 세션 가드 + 우유와 치즈 목록·치즈 보관함 상태.
 * 세션(./session.ts): 복원 중이면 아무것도 그리지 않고 기다림(배경색만, 보통 수백 ms), 로그인 안 됨이면 앱을 막 연 경우 스플래시부터·
 * 로그인이 풀렸거나 로그아웃했으면 로그인 화면으로, 초기 설정 전이면 초기 설정으로.
 * 목록의 현재 페이지·선택은 상세(/cheese/:concernId)에 다녀와도 유지돼야 해서(docs/api/common.md 고민 목록 규칙)
 * 목록·상세를 함께 감싸는 여기서 들고 있는다. 다른 탭에 다녀와도 유지 — 라우터 전 App.tsx 와 같은 동작.
 */
export function AppShell() {
  const [cheeseList, setCheeseList] = useState<CheeseListState>({ page: 0, selectedId: null })
  const [vaultPage, setVaultPage] = useState(0)
  const [vaultTab, setVaultTab] = useState<CheeseTab>('mine')
  const session = useSession()
  if (session.status === 'restoring') return null
  if (session.status === 'signedOut') return <Navigate to={session.reason === 'initial' ? '/splash' : '/login'} replace />
  if (session.status === 'needsSetup') return <Navigate to="/setup" replace state={{ requiresConsent: false }} />
  // 로그인했지만 이 계정이 온보딩을 본 적이 없고 이 기기에서도 안 봤으면 먼저 온보딩(session.ts "온보딩 완료")
  if (session.needsOnboarding) return <Navigate to="/onboarding" replace />
  return (
    <Outlet context={{ cheeseList, setCheeseList, vaultPage, setVaultPage, vaultTab, setVaultTab } satisfies AppShellContext} />
  )
}

const TAB_PATHS: Record<string, string> = { home: '/', sheep: '/emotion', cheese: '/cheese', cloud: '/wool', cave: '/cave' }

function tabOf(pathname: string) {
  if (pathname === '/emotion') return 'sheep'
  if (pathname === '/wool') return 'cloud'
  // 임의 결정(확인 필요): 치즈 보관함도 "고민치즈" 탭 — 시안(290:636)은 "홈"이 선택돼 있지만 템플릿 복사로 봄
  if (pathname === '/cheese' || pathname === '/cheese/vault') return 'cheese'
  if (pathname === '/cave') return 'cave'
  return 'home'
}

/** 탭바가 있는 화면(홈·양 먹이주기·우유와 치즈 목록·치즈 보관함·양털 모으기·동굴 문 닫기). */
export function TabLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <>
      <Outlet context={useOutletContext<AppShellContext>()} />
      <AppTabBar
        value={tabOf(pathname)}
        onChange={(tab) => {
          const path = TAB_PATHS[tab]
          // 홈 ↔ 동굴 문 닫기는 두 화면 모두 섬 그림이 있어 섬이 옮겨 가는 전환을 켠다
          const islandMove = (pathname === '/' && path === '/cave') || (pathname === '/cave' && path === '/')
          if (path) navigate(path, { viewTransition: islandMove })
        }}
      />
    </>
  )
}

export function HomeRoute() {
  const navigate = useNavigate()
  const { setVaultTab, setVaultPage } = useOutletContext<AppShellContext>()
  // 홈의 "내 기록, 보관함" 카드는 보관함 화면이 생기기 전까지 양 먹이주기(지난 기록·지푸라기 목록)로 보낸다
  return (
    <HomePage
      onOpenEmotion={() => navigate('/emotion')}
      onOpenRecords={() => navigate('/emotion')}
      // 섬 그림이 홈 자리에서 섬 꾸미기 자리로 옮겨 가는 전환(View Transitions, global.css 의 island)
      onOpenDecorate={() => navigate('/island', { viewTransition: true })}
      // 섬 꾸미기와 같이 섬 그림이 홈 자리에서 동굴 화면 자리로 옮겨 간다
      onCloseCave={() => navigate('/cave', { viewTransition: true })}
      onOpenSettings={() => navigate('/settings')}
      // 숙성이 끝난 치즈 알림 — 치즈 보관함 "내 고민" 탭 첫 페이지로(열어볼 치즈가 맨 앞에 모여 있다)
      onOpenMaturedCheese={() => {
        setVaultTab('mine')
        setVaultPage(0)
        navigate('/cheese/vault')
      }}
    />
  )
}

/** 섬 꾸미기 — 탭바 없음(시안 102:744). */
export function IslandDecorateRoute() {
  const navigate = useNavigate()
  return (
    <IslandDecoratePage
      onBack={() => navigate('/', { viewTransition: true })}
      onOpenSettings={() => navigate('/settings')}
    />
  )
}

/**
 * 설정 — 탭바 없음(시안 290:891). 홈·섬 꾸미기 머리의 설정 아이콘으로 들어온다.
 * 임의 결정(확인 필요): 뒤로가기는 브라우저 기록으로 들어온 화면에 돌아가고, 주소로 바로 열어 기록이 없으면 홈으로(replace).
 * 저장하지 않은 변경은 확인 없이 버린다.
 * "계정 바꾸기"(Google로 계속하기)는 로그아웃(`POST /auth/logout`) 뒤 로그인 화면으로 — 세션이 닫히면 AppShell 이 /login 으로 replace 한다.
 */
export function SettingsRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <SettingsPage
      onBack={() => (location.key === 'default' ? navigate('/', { replace: true }) : navigate(-1))}
      onSwitchAccount={() => logout()}
      onLogout={logout}
    />
  )
}

export function EmotionRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  return (
    <EmotionPage
      woolCount={woolCount}
      onOpenWrite={() => navigate('/emotion/write')}
      onOpenRecord={(id) => navigate(`/emotion/records/${encodeURIComponent(id)}`)}
    />
  )
}

export function WoolCollectionRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  return <WoolCollectionPage woolCount={woolCount} onOpenWoolHistory={() => navigate('/wool/history')} />
}

/** 양털 내역 — 탭바 없음(시안 없음). 뒤로가기는 양털 모으기로. */
export function WoolHistoryRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  return <WoolHistoryPage woolCount={woolCount} onBack={() => navigate('/wool')} />
}

export function EmotionWriteRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  return (
    <EmotionWritePage
      woolCount={woolCount}
      onBack={() => navigate('/emotion')}
      onFed={() => navigate('/emotion', { replace: true })}
    />
  )
}

export function EmotionRecordRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  const { recordId = '' } = useParams()
  return (
    <EmotionRecordPage
      // 다른 기록으로 바뀌면 삭제 확인 모달·상태를 새로 시작한다
      key={recordId}
      woolCount={woolCount}
      recordId={recordId}
      onBack={() => navigate('/emotion')}
      onDeleted={() => navigate('/emotion', { replace: true })}
      onEdit={() => navigate(`/emotion/records/${encodeURIComponent(recordId)}/edit`)}
    />
  )
}

/** 감정 기록 수정 — 작성 화면 재사용, 탭바 없음. 저장하면 상세로(replace — 뒤로가기가 수정 화면으로 돌아오지 않게). */
export function EmotionEditRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  const { recordId = '' } = useParams()
  const detail = `/emotion/records/${encodeURIComponent(recordId)}`
  return (
    <EmotionWritePage
      key={recordId}
      woolCount={woolCount}
      recordId={recordId}
      onBack={() => navigate(detail)}
      onSaved={() => navigate(detail, { replace: true })}
      onNotFound={() => navigate('/emotion', { replace: true })}
    />
  )
}

export function CheeseRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  const { cheeseList, setCheeseList } = useOutletContext<AppShellContext>()
  return (
    <CheesePage
      woolCount={woolCount}
      page={cheeseList.page}
      onPageChange={(page) => setCheeseList((prev) => ({ ...prev, page }))}
      selectedId={cheeseList.selectedId}
      onSelect={(selectedId) => setCheeseList((prev) => ({ ...prev, selectedId }))}
      onOpenConcern={(id) => navigate(`/cheese/${encodeURIComponent(id)}`)}
      onWrite={() => navigate('/cheese/write')}
      onOpenVault={() => navigate('/cheese/vault')}
    />
  )
}

/** 고민 쓰기 — 탭바 없음. 다 쓰면 새 고민의 상세(숙성 중)로 replace — 뒤로가기가 쓰기 화면으로 돌아가지 않게. */
export function ConcernWriteRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  const { setVaultTab, setVaultPage } = useOutletContext<AppShellContext>()
  return (
    <ConcernWritePage
      woolCount={woolCount}
      onBack={() => navigate('/cheese')}
      onCreated={(id) => {
        // 상세에서 뒤로 가면 새 고민이 맨 앞에 있는 보관함 "내 고민" 탭 첫 페이지로
        setVaultTab('mine')
        setVaultPage(0)
        navigate(`/cheese/vault/${encodeURIComponent(id)}`, { replace: true })
      }}
    />
  )
}

/** 내 치즈 보관함 — 탭바 있음(시안 290:636), "고민치즈" 탭. 뒤로가기는 우유와 치즈 목록으로, "더보기"는 내 고민 상세로, 빈 "내 고민"은 고민 쓰기로. */
export function CheeseVaultRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  const { vaultPage, setVaultPage, vaultTab, setVaultTab } = useOutletContext<AppShellContext>()
  return (
    <CheeseVaultPage
      woolCount={woolCount}
      tab={vaultTab}
      onTabChange={(tab) => {
        setVaultTab(tab)
        setVaultPage(0)
      }}
      page={vaultPage}
      onPageChange={setVaultPage}
      onOpenConcern={(id) => navigate(`/cheese/vault/${encodeURIComponent(id)}`)}
      onWrite={() => navigate('/cheese/write')}
      onBack={() => navigate('/cheese')}
    />
  )
}

/** 내 고민 상세(받은 위로) — 탭바 없음(고민 상세와 같음). 뒤로가기는 치즈 보관함으로. */
export function MyConcernDetailRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  const { concernId = '' } = useParams()
  return (
    <MyConcernDetailPage
      key={concernId}
      woolCount={woolCount}
      concernId={concernId}
      onBack={() => navigate('/cheese/vault')}
      onDeleted={() => navigate('/cheese/vault', { replace: true })}
    />
  )
}

export function ConcernDetailRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  const { concernId = '' } = useParams()
  const { setCheeseList } = useOutletContext<AppShellContext>()
  return (
    <ConcernDetailPage
      woolCount={woolCount}
      concernId={concernId}
      onBack={() => navigate('/cheese')}
      onDone={() => {
        // 위로를 남긴(또는 마감된) 고민은 목록에서 빠지므로 선택도 비운다
        setCheeseList((prev) => ({ ...prev, selectedId: null }))
        navigate('/cheese', { replace: true })
      }}
    />
  )
}

/**
 * 동굴 문 닫기 시작 전 — 탭바 있음(시안 37:26). 쉬는 중이면 진행 중 화면으로.
 * 임의 결정(확인 필요): 시작하면 진행 중 화면으로 replace — 진행 중 화면에서 브라우저 뒤로가기를 누르면 시작 전 화면이 아니라
 * 그 전 화면(홈 등)으로 나간다. 휴식은 서버에서 계속되고, 다시 /cave 로 오면 진행 중 화면으로 돌아온다.
 * (push 로 두면 뒤로가기 → /cave → 쉬는 중이라 다시 진행 중 화면으로 보내져 뒤로가기가 먹히지 않는다.)
 */
export function CaveRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  return (
    <CavePage
      woolCount={woolCount}
      onRunning={() => navigate('/cave/session', { replace: true })}
      // 문이 닫힌 뒤: 버튼이 아래 자리로 미끄러져 "동굴 문 열기"가 되고, 탭바는 내려가며 사라진다(global.css 의 cave-* 전환)
      onStarted={() => navigate('/cave/session', { replace: true, viewTransition: true })}
    />
  )
}

/** 동굴 문 닫기 진행 중 — 탭바 없음(시안 63:1283). 끝나거나 진행 중 휴식이 없으면 시작 전 화면으로(replace). */
export function CaveSessionRoute() {
  const navigate = useNavigate()
  return (
    <CaveSessionPage
      // 문이 열린 뒤: 버튼이 탭바 위 자리로 올라가 "동굴 문 닫기"가 되고, 탭바는 아래에서 올라온다
      onEnded={() => navigate('/cave', { replace: true, viewTransition: true })}
      onNoSession={() => navigate('/cave', { replace: true })}
    />
  )
}
