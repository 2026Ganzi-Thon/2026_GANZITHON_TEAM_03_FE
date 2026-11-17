import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Navigate, Outlet, ScrollRestoration, useLocation, useNavigate, useOutletContext, useParams } from 'react-router'
import AuthPage from '@/pages/AuthPage'
import CheesePage from '@/pages/CheesePage'
import ConcernDetailPage from '@/pages/ConcernDetailPage'
import EmotionPage from '@/pages/EmotionPage'
import EmotionRecordPage from '@/pages/EmotionRecordPage'
import EmotionWritePage from '@/pages/EmotionWritePage'
import HomePage from '@/pages/HomePage'
import InitialSetupPage from '@/pages/InitialSetupPage'
import IslandDecoratePage from '@/pages/IslandDecoratePage'
import OnboardingPage from '@/pages/OnboardingPage'
import SplashPage from '@/pages/SplashPage'
import { useWoolBalance } from '@/shared/wool'
import { isGoogleSignupConsentRequired, signInWithEmail, signInWithGoogle } from '@/features/auth'
import { checkNicknameAvailability } from '@/features/account'
import type { InitialSetupValues } from '@/pages/InitialSetupPage'
import AppTabBar from './AppTabBar'
import { hasPassedEntry, markEntryPassed, markOnboardingSeen } from './entry'

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

export function SplashRoute() {
  const navigate = useNavigate()
  return (
    <SplashPage
      onComplete={() => navigate('/onboarding', { replace: true })}
    />
  )
}

export function OnboardingRoute() {
  const navigate = useNavigate()
  return (
    <OnboardingPage
      onComplete={() => {
        markOnboardingSeen()
        // 임의 결정(확인 필요): 온보딩도 끝난 화면으로 보고 replace. 로그인의 뒤로 버튼은 그대로 /onboarding 으로 간다
        navigate('/login', { replace: true })
      }}
    />
  )
}

function AuthRoute({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const handleGoogleCredential = async (credential: string) => {
    setGoogleLoading(true)
    setGoogleError('')
    try {
      const result = await signInWithGoogle(credential)
      if (result.isNewUser) {
        navigate('/setup', { state: { googleCredential: credential, requiresConsent: false } })
      } else if (!result.user.profileCompleted) {
        navigate('/setup', { state: { requiresConsent: false } })
      } else {
        markEntryPassed()
        navigate('/', { replace: true })
      }
    } catch (error) {
      if (isGoogleSignupConsentRequired(error)) {
        navigate('/setup', { state: { googleCredential: credential, requiresConsent: true } })
      } else {
        setGoogleError(error instanceof Error ? error.message : 'Google 로그인을 완료하지 못했어요.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleContinue = async ({ email, password }: { email: string; password: string }) => {
    setAuthError('')
    if (mode === 'signup') {
      navigate('/setup')
      return
    }

    setAuthLoading(true)
    try {
      const result = await signInWithEmail(email, password)
      if (!result.user.profileCompleted) {
        navigate('/setup', { state: { requiresConsent: false } })
      } else {
        markEntryPassed()
        navigate('/', { replace: true })
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : '로그인하지 못했어요. 다시 시도해주세요.')
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <AuthPage
      mode={mode}
      onBack={() => navigate(mode === 'login' ? '/onboarding' : '/login')}
      onSwitchMode={() => navigate(mode === 'login' ? '/signup' : '/login')}
      onGoogleCredential={handleGoogleCredential}
      googleLoading={googleLoading}
      googleError={googleError}
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

export function SetupRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const [googleError, setGoogleError] = useState('')
  const routeState = location.state as { googleCredential?: string; requiresConsent?: boolean } | null
  return (
    <InitialSetupPage
      onBack={() => navigate('/signup')}
      onLogin={() => navigate('/login')}
      onCheckNickname={async (nickname) => (await checkNicknameAvailability(nickname)).available}
      requiresConsent={routeState?.requiresConsent ?? true}
      submissionError={googleError}
      onBeforeComplete={async (values: InitialSetupValues) => {
        if (!routeState?.googleCredential || !routeState.requiresConsent) return true
        setGoogleError('')
        try {
          await signInWithGoogle(routeState.googleCredential, {
            termsAgreed: true,
            privacyAgreed: true,
            marketingAgreed: values.consents.marketing,
          })
          return true
        } catch (error) {
          setGoogleError(error instanceof Error ? error.message : 'Google 회원가입을 완료하지 못했어요.')
          return false
        }
      }}
      onComplete={() => {
        markEntryPassed()
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
}

/**
 * 앱 화면 공통 부모: 시작 흐름 가드 + 우유와 치즈 목록 상태.
 * 목록의 현재 페이지·선택은 상세(/cheese/:concernId)에 다녀와도 유지돼야 해서(docs/api/common.md 고민 목록 규칙)
 * 목록·상세를 함께 감싸는 여기서 들고 있는다. 다른 탭에 다녀와도 유지 — 라우터 전 App.tsx 와 같은 동작.
 */
export function AppShell() {
  const [cheeseList, setCheeseList] = useState<CheeseListState>({ page: 0, selectedId: null })
  if (!hasPassedEntry()) return <Navigate to="/splash" replace />
  return <Outlet context={{ cheeseList, setCheeseList } satisfies AppShellContext} />
}

const TAB_PATHS: Record<string, string> = { home: '/', sheep: '/emotion', cheese: '/cheese' }

function tabOf(pathname: string) {
  if (pathname === '/emotion') return 'sheep'
  if (pathname === '/cheese') return 'cheese'
  return 'home'
}

/** 탭바가 있는 화면(홈·양 먹이주기·우유와 치즈 목록). cloud·cave 탭은 이동할 화면이 없어 동작 없음. */
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
          if (path) navigate(path)
        }}
      />
    </>
  )
}

export function HomeRoute() {
  const navigate = useNavigate()
  // 홈의 "내 기록, 보관함" 카드는 보관함 화면이 생기기 전까지 양 먹이주기(지난 기록·지푸라기 목록)로 보낸다
  return (
    <HomePage
      onOpenEmotion={() => navigate('/emotion')}
      onOpenRecords={() => navigate('/emotion')}
      // 섬 그림이 홈 자리에서 섬 꾸미기 자리로 옮겨 가는 전환(View Transitions, global.css 의 island)
      onOpenDecorate={() => navigate('/island', { viewTransition: true })}
    />
  )
}

/** 섬 꾸미기 — 탭바 없음(시안 102:744). 설정 화면이 없어 설정 아이콘은 동작 없음. */
export function IslandDecorateRoute() {
  const navigate = useNavigate()
  return <IslandDecoratePage onBack={() => navigate('/', { viewTransition: true })} />
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
