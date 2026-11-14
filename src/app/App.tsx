import { useState } from 'react'
import EmotionPage from '@/pages/EmotionPage'
import EmotionWritePage from '@/pages/EmotionWritePage'
import HomePage from '@/pages/HomePage'
import AppTabBar from './AppTabBar'

type Screen = 'home' | 'emotion' | 'emotionWrite'

// 임시값: 양털은 care 기능 소관이라 API 연결 전까지 홈 mock(12)과 맞춘 고정값을 내려준다
const TEMP_WOOL_COUNT = 12

// TODO(임시): 라우터가 생기기 전까지 useState 로 화면을 바꿔 가며 확인한다(home → emotion → emotionWrite → emotion). 라우터 도입 시 교체한다.
// 탭바도 임시로 여기서 붙인다: 홈·양 먹이주기에만 보이고(작성 화면은 시안에 없음), 이동은 home·sheep 만. 나머지 탭은 화면이 생기면 연결.
export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  const handleTab = (tab: string) => {
    if (tab === 'home') setScreen('home')
    else if (tab === 'sheep') setScreen('emotion')
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
        <EmotionPage woolCount={TEMP_WOOL_COUNT} onOpenWrite={() => setScreen('emotionWrite')} />
      ) : (
        <HomePage onOpenEmotion={() => setScreen('emotion')} />
      )}
      <AppTabBar value={screen === 'emotion' ? 'sheep' : 'home'} onChange={handleTab} />
    </>
  )
}
