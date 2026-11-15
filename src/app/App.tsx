import HomePage from '@/pages/HomePage'
import AuthPage from '@/pages/AuthPage'
import InitialSetupPage from '@/pages/InitialSetupPage'
import OnboardingPage from '@/pages/OnboardingPage'
import SplashPage from '@/pages/SplashPage'
import { useState } from 'react'

// TODO(임시): 라우터가 생기기 전까지 첫 진입 화면 전환을 상태로 관리한다.
export default function App() {
  const [stage, setStage] = useState<'splash' | 'onboarding' | 'login' | 'signup' | 'setup' | 'home'>('splash')

  if (stage === 'splash') return <SplashPage onComplete={() => setStage('onboarding')} />
  if (stage === 'onboarding') return <OnboardingPage onComplete={() => setStage('home')} />
  if (stage === 'login') {
    return (
      <AuthPage
        mode="login"
        onBack={() => setStage('onboarding')}
        onSwitchMode={() => setStage('signup')}
        onContinue={() => setStage('home')}
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
      />
    )
  }
  if (stage === 'setup') {
    return (
      <InitialSetupPage
        onBack={() => setStage('signup')}
        onLogin={() => setStage('login')}
        onComplete={() => setStage('home')}
      />
    )
  }
  return <HomePage />
}
