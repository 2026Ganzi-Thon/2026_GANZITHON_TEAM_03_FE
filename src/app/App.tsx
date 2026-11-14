import { useState } from 'react'
import EmotionPage from '@/pages/EmotionPage'
import EmotionWritePage from '@/pages/EmotionWritePage'
import HomePage from '@/pages/HomePage'

type Screen = 'home' | 'emotion' | 'emotionWrite'

// 임시값: 양털은 care 기능 소관이라 API 연결 전까지 홈 mock(12)과 맞춘 고정값을 내려준다
const TEMP_WOOL_COUNT = 12

// TODO(임시): 라우터가 생기기 전까지 useState 로 화면을 바꿔 가며 확인한다(home → emotion → emotionWrite → emotion). 라우터 도입 시 교체한다.
export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'emotion') {
    return <EmotionPage woolCount={TEMP_WOOL_COUNT} onOpenWrite={() => setScreen('emotionWrite')} />
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
  return <HomePage onOpenEmotion={() => setScreen('emotion')} />
}
