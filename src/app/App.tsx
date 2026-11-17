import { useEffect, useState } from 'react'
import { preloadCheeseAssets } from '@/features/cheese'
import { preloadEmotionAssets } from '@/features/emotion'
import { checkNicknameAvailability, completeInitialProfile, completeOnboarding } from '@/features/account'
import {
  isGoogleSignupConsentRequired,
  signInWithGoogle,
} from '@/features/auth'
import type { GoogleSignupConsent } from '@/features/auth'
import CheesePage from '@/pages/CheesePage'
import ConcernDetailPage from '@/pages/ConcernDetailPage'
import EmotionPage from '@/pages/EmotionPage'
import EmotionRecordPage from '@/pages/EmotionRecordPage'
import EmotionWritePage from '@/pages/EmotionWritePage'
import HomePage from '@/pages/HomePage'
import AuthPage from '@/pages/AuthPage'
import InitialSetupPage from '@/pages/InitialSetupPage'
import type { InitialSetupValues } from '@/pages/InitialSetupPage'
import OnboardingPage from '@/pages/OnboardingPage'
import SplashPage from '@/pages/SplashPage'
import AppTabBar from './AppTabBar'

type Screen = 'home' | 'emotion' | 'emotionWrite' | 'emotionRecord' | 'cheese' | 'concernDetail'
type EntryStage = 'splash' | 'onboarding' | 'login' | 'signup' | 'setup' | 'home'

// 임시값: 양털은 care 기능 소관이라 API 연결 전까지 홈 mock(12)과 맞춘 고정값을 내려준다
const TEMP_WOOL_COUNT = 12

// TODO(임시): 라우터가 생기기 전까지 useState 로 화면을 바꿔 가며 확인한다(home → emotion → emotionWrite·emotionRecord → emotion, cheese → concernDetail → cheese). 라우터 도입 시 교체한다.
// 탭바도 임시로 여기서 붙인다: 홈·양 먹이주기·우유와 치즈 목록에만 보이고(작성·기록 상세·고민 상세 화면은 시안에 없음), 이동은 home·sheep·cheese 만. 나머지 탭은 화면이 생기면 연결.
// 홈의 "내 기록, 보관함" 카드는 보관함 화면이 생기기 전까지 양 먹이주기(지난 기록·지푸라기 목록)로 보낸다.
// 기록 상세에서 고른 recordId 도 라우터 전까지 여기서 들고 있는다(라우터가 생기면 경로 파라미터로).
// 우유와 치즈 목록의 현재 페이지·선택은 상세에 다녀와도 유지돼야 해서(docs/api/common.md 고민 목록 규칙) 라우터 전까지 여기서 들고 있는다.
export default function App() {
  const [stage, setStage] = useState<EntryStage>('splash')
  const [screen, setScreen] = useState<Screen>('home')
  const [cheeseList, setCheeseList] = useState<{ page: number; selectedId: string | null }>({
    page: 0,
    selectedId: null,
  })
  const [concernId, setConcernId] = useState<string | null>(null)
  const [recordId, setRecordId] = useState<string | null>(null)
  const [googleCredential, setGoogleCredential] = useState<string | null>(null)
  const [googleConsentRequired, setGoogleConsentRequired] = useState(false)
  const [googleSessionReady, setGoogleSessionReady] = useState(false)
  const [googleOnboardingRequired, setGoogleOnboardingRequired] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')
  const [setupSubmitting, setSetupSubmitting] = useState(false)
  const [setupError, setSetupError] = useState('')

  // 홈에서 양 돌보기로 넘어오는 흐름이라, 앱이 뜨면 뒤에서 양 이미지를 미리 받아 둔다
  useEffect(() => {
    preloadEmotionAssets()
    preloadCheeseAssets()
  }, [])

  const handleTab = (tab: string) => {
    if (tab === 'home') setScreen('home')
    else if (tab === 'sheep') setScreen('emotion')
    else if (tab === 'cheese') setScreen('cheese')
  }

  const clearGoogleFlow = () => {
    setGoogleCredential(null)
    setGoogleConsentRequired(false)
    setGoogleSessionReady(false)
    setGoogleOnboardingRequired(false)
    setGoogleError('')
    setSetupError('')
  }

  const handleGoogleCredential = async (credential: string) => {
    setGoogleLoading(true)
    setGoogleError('')

    try {
      const result = await signInWithGoogle(credential)
      setGoogleCredential(credential)
      setGoogleSessionReady(true)
      setGoogleConsentRequired(false)
      setGoogleOnboardingRequired(!result.user.onboardingCompleted)
      if (result.user.profileCompleted) {
        if (!result.user.onboardingCompleted) await completeOnboarding()
        clearGoogleFlow()
        setStage('home')
      } else {
        setStage('setup')
      }
    } catch (error) {
      if (isGoogleSignupConsentRequired(error)) {
        setGoogleCredential(credential)
        setGoogleSessionReady(false)
        setGoogleConsentRequired(true)
        setStage('setup')
      } else {
        setGoogleError(error instanceof Error ? error.message : 'Google 로그인에 실패했어요. 다시 시도해 주세요.')
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleInitialSetupComplete = async (values: InitialSetupValues) => {
    setSetupSubmitting(true)
    setSetupError('')

    try {
      let shouldCompleteOnboarding = googleOnboardingRequired
      if (googleCredential && googleConsentRequired && !googleSessionReady) {
        const consent: GoogleSignupConsent = {
          termsAgreed: true,
          privacyAgreed: true,
          marketingAgreed: values.consents.marketing,
        }
        const result = await signInWithGoogle(googleCredential, consent)
        setGoogleSessionReady(true)
        setGoogleConsentRequired(false)
        setGoogleOnboardingRequired(!result.user.onboardingCompleted)
        shouldCompleteOnboarding = !result.user.onboardingCompleted
      }

      if (googleCredential) {
        await completeInitialProfile({ nickname: values.nickname, ageGroup: values.ageGroup })
        if (shouldCompleteOnboarding) await completeOnboarding()
        clearGoogleFlow()
      }

      setStage('home')
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : '설정을 저장하지 못했어요. 다시 시도해 주세요.')
    } finally {
      setSetupSubmitting(false)
    }
  }

  if (stage === 'splash') {
    return <SplashPage onComplete={() => setStage('onboarding')} />
  }
  if (stage === 'onboarding') {
    return <OnboardingPage onComplete={() => setStage('login')} />
  }
  if (stage === 'login') {
    return (
      <AuthPage
        mode="login"
        onBack={() => setStage('onboarding')}
        onSwitchMode={() => setStage('signup')}
        onContinue={() => setStage('home')}
        onGoogleCredential={handleGoogleCredential}
        googleLoading={googleLoading}
        googleError={googleError}
      />
    )
  }
  if (stage === 'signup') {
    return (
      <AuthPage
        mode="signup"
        onBack={() => setStage('login')}
        onSwitchMode={() => setStage('login')}
        onContinue={() => setStage('setup')}
        onGoogleCredential={handleGoogleCredential}
        googleLoading={googleLoading}
        googleError={googleError}
      />
    )
  }
  if (stage === 'setup') {
    return (
      <InitialSetupPage
        onBack={() => setStage('signup')}
        onLogin={() => setStage('login')}
        onComplete={handleInitialSetupComplete}
        onCheckNickname={googleSessionReady
          ? async (nickname) => (await checkNicknameAvailability(nickname)).available
          : undefined}
        requiresConsent={googleConsentRequired}
        consentNotice={googleConsentRequired ? 'Google 계정으로 가입을 계속하려면 필수 약관에 동의해주세요.' : undefined}
        isSubmitting={setupSubmitting}
        submissionError={setupError}
      />
    )
  }

  if (screen === 'concernDetail' && concernId) {
    return (
      <ConcernDetailPage
        woolCount={TEMP_WOOL_COUNT}
        concernId={concernId}
        onBack={() => setScreen('cheese')}
        onDone={() => {
          // 위로를 남긴(또는 마감된) 고민은 목록에서 빠지므로 선택도 비운다
          setCheeseList((prev) => ({ ...prev, selectedId: null }))
          setScreen('cheese')
        }}
      />
    )
  }
  if (screen === 'emotionRecord' && recordId) {
    return (
      <EmotionRecordPage
        // 다른 기록으로 바뀌면 삭제 확인 모달·상태를 새로 시작한다
        key={recordId}
        woolCount={TEMP_WOOL_COUNT}
        recordId={recordId}
        onBack={() => setScreen('emotion')}
        onDeleted={() => setScreen('emotion')}
      />
    )
  }
  if (screen === 'emotionWrite') {
    return (
      <EmotionWritePage
        woolCount={TEMP_WOOL_COUNT}
        onBack={() => setScreen('emotion')}
        onFed={() => setScreen('emotion')}
      />
    )
  }
  return (
    <>
      {screen === 'emotion' ? (
        <EmotionPage
          woolCount={TEMP_WOOL_COUNT}
          onOpenWrite={() => setScreen('emotionWrite')}
          onOpenRecord={(id) => {
            setRecordId(id)
            setScreen('emotionRecord')
          }}
        />
      ) : screen === 'cheese' ? (
        <CheesePage
          woolCount={TEMP_WOOL_COUNT}
          page={cheeseList.page}
          onPageChange={(page) => setCheeseList((prev) => ({ ...prev, page }))}
          selectedId={cheeseList.selectedId}
          onSelect={(selectedId) => setCheeseList((prev) => ({ ...prev, selectedId }))}
          onOpenConcern={(id) => {
            setConcernId(id)
            setScreen('concernDetail')
          }}
        />
      ) : (
        <HomePage onOpenEmotion={() => setScreen('emotion')} onOpenRecords={() => setScreen('emotion')} />
      )}
      <AppTabBar value={screen === 'emotion' ? 'sheep' : screen === 'cheese' ? 'cheese' : 'home'} onChange={handleTab} />
    </>
  )
}
