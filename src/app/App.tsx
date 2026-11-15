import { useEffect, useState } from 'react'
import { preloadCheeseAssets } from '@/features/cheese'
import { preloadEmotionAssets } from '@/features/emotion'
import CheesePage from '@/pages/CheesePage'
import ConcernDetailPage from '@/pages/ConcernDetailPage'
import EmotionPage from '@/pages/EmotionPage'
import EmotionRecordPage from '@/pages/EmotionRecordPage'
import EmotionWritePage from '@/pages/EmotionWritePage'
import HomePage from '@/pages/HomePage'
import AppTabBar from './AppTabBar'

type Screen = 'home' | 'emotion' | 'emotionWrite' | 'emotionRecord' | 'cheese' | 'concernDetail'

// 임시값: 양털은 care 기능 소관이라 API 연결 전까지 홈 mock(12)과 맞춘 고정값을 내려준다
const TEMP_WOOL_COUNT = 12

// TODO(임시): 라우터가 생기기 전까지 useState 로 화면을 바꿔 가며 확인한다(home → emotion → emotionWrite·emotionRecord → emotion, cheese → concernDetail → cheese). 라우터 도입 시 교체한다.
// 탭바도 임시로 여기서 붙인다: 홈·양 먹이주기·우유와 치즈 목록에만 보이고(작성·기록 상세·고민 상세 화면은 시안에 없음), 이동은 home·sheep·cheese 만. 나머지 탭은 화면이 생기면 연결.
// 기록 상세에서 고른 recordId 도 라우터 전까지 여기서 들고 있는다(라우터가 생기면 경로 파라미터로).
// 우유와 치즈 목록의 현재 페이지·선택은 상세에 다녀와도 유지돼야 해서(docs/api/common.md 고민 목록 규칙) 라우터 전까지 여기서 들고 있는다.
export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [cheeseList, setCheeseList] = useState<{ page: number; selectedId: string | null }>({
    page: 0,
    selectedId: null,
  })
  const [concernId, setConcernId] = useState<string | null>(null)
  const [recordId, setRecordId] = useState<string | null>(null)

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
        <HomePage onOpenEmotion={() => setScreen('emotion')} />
      )}
      <AppTabBar value={screen === 'emotion' ? 'sheep' : screen === 'cheese' ? 'cheese' : 'home'} onChange={handleTab} />
    </>
  )
}
