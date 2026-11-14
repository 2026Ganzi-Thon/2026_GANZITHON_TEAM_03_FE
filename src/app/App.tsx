import HomePage from '@/pages/HomePage'
import OnboardingPage from '@/pages/OnboardingPage'
import SplashPage from '@/pages/SplashPage'
import { useState } from 'react'

// TODO(임시): 라우터가 생기기 전까지 스플래시, 온보딩, 홈을 순서대로 보여준다.
export default function App() {
  const [stage, setStage] = useState<'splash' | 'onboarding' | 'home'>('splash')

  if (stage === 'splash') return <SplashPage onComplete={() => setStage('onboarding')} />
  if (stage === 'onboarding') return <OnboardingPage onComplete={() => setStage('home')} />
  return <HomePage />
}
