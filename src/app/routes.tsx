import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Navigate, Outlet, ScrollRestoration, useLocation, useNavigate, useOutletContext, useParams } from 'react-router'
import AuthPage from '@/pages/AuthPage'
import CavePage from '@/pages/CavePage'
import CaveSessionPage from '@/pages/CaveSessionPage'
import CheesePage from '@/pages/CheesePage'
import CheeseVaultPage from '@/pages/CheeseVaultPage'
import ConcernDetailPage from '@/pages/ConcernDetailPage'
import EmotionPage from '@/pages/EmotionPage'
import EmotionRecordPage from '@/pages/EmotionRecordPage'
import EmotionWritePage from '@/pages/EmotionWritePage'
import HomePage from '@/pages/HomePage'
import InitialSetupPage from '@/pages/InitialSetupPage'
import IslandDecoratePage from '@/pages/IslandDecoratePage'
import MyConcernDetailPage from '@/pages/MyConcernDetailPage'
import OnboardingPage from '@/pages/OnboardingPage'
import SettingsPage from '@/pages/SettingsPage'
import SplashPage from '@/pages/SplashPage'
import { useWoolBalance } from '@/shared/wool'
import { isGoogleSignupConsentRequired, signInWithEmail, signInWithGoogle } from '@/features/auth'
import { fetchNicknameAvailability } from '@/features/account'
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
      onCheckNickname={async (nickname) => (await fetchNicknameAvailability(nickname)).available}
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
  /** 치즈 보관함의 현재 페이지 — 내 고민 상세에 다녀와도 유지 */
  vaultPage: number
  setVaultPage: Dispatch<SetStateAction<number>>
}

/**
 * 앱 화면 공통 부모: 시작 흐름 가드 + 우유와 치즈 목록·치즈 보관함 상태.
 * 목록의 현재 페이지·선택은 상세(/cheese/:concernId)에 다녀와도 유지돼야 해서(docs/api/common.md 고민 목록 규칙)
 * 목록·상세를 함께 감싸는 여기서 들고 있는다. 다른 탭에 다녀와도 유지 — 라우터 전 App.tsx 와 같은 동작.
 */
export function AppShell() {
  const [cheeseList, setCheeseList] = useState<CheeseListState>({ page: 0, selectedId: null })
  const [vaultPage, setVaultPage] = useState(0)
  if (!hasPassedEntry()) return <Navigate to="/splash" replace />
  return <Outlet context={{ cheeseList, setCheeseList, vaultPage, setVaultPage } satisfies AppShellContext} />
}

const TAB_PATHS: Record<string, string> = { home: '/', sheep: '/emotion', cheese: '/cheese', cave: '/cave' }

function tabOf(pathname: string) {
  if (pathname === '/emotion') return 'sheep'
  // 임의 결정(확인 필요): 치즈 보관함도 "고민치즈" 탭 — 시안(290:636)은 "홈"이 선택돼 있지만 템플릿 복사로 봄
  if (pathname === '/cheese' || pathname === '/cheese/vault') return 'cheese'
  if (pathname === '/cave') return 'cave'
  return 'home'
}

/** 탭바가 있는 화면(홈·양 먹이주기·우유와 치즈 목록·치즈 보관함·동굴 문 닫기). cloud 탭은 이동할 화면이 없어 동작 없음. */
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
 * 임의 결정(확인 필요): "계정 바꾸기"(Google로 계속하기)는 실제 구글 로그인이 생기기 전까지 로그인 화면으로 보낸다(push — 뒤로가기로 설정에 돌아옴).
 */
export function SettingsRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <SettingsPage
      onBack={() => (location.key === 'default' ? navigate('/', { replace: true }) : navigate(-1))}
      onSwitchAccount={() => navigate('/login')}
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
      onOpenVault={() => navigate('/cheese/vault')}
    />
  )
}

/** 내 치즈 보관함 — 탭바 있음(시안 290:636), "고민치즈" 탭. 뒤로가기는 우유와 치즈 목록으로, "더보기"는 내 고민 상세로. */
export function CheeseVaultRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  const { vaultPage, setVaultPage } = useOutletContext<AppShellContext>()
  return (
    <CheeseVaultPage
      woolCount={woolCount}
      page={vaultPage}
      onPageChange={setVaultPage}
      onOpenConcern={(id) => navigate(`/cheese/vault/${encodeURIComponent(id)}`)}
      onBack={() => navigate('/cheese')}
    />
  )
}

/** 내 고민 상세(받은 위로) — 탭바 없음(고민 상세와 같음). 뒤로가기는 치즈 보관함으로. */
export function MyConcernDetailRoute() {
  const navigate = useNavigate()
  const woolCount = useWoolBalance()
  const { concernId = '' } = useParams()
  return <MyConcernDetailPage key={concernId} woolCount={woolCount} concernId={concernId} onBack={() => navigate('/cheese/vault')} />
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
