import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { preloadCheeseAssets } from '@/features/cheese'
import { preloadEmotionAssets } from '@/features/emotion'
import { preloadHomeAssets } from '@/features/home'
import { preloadOnboardingAssets } from '@/features/onboarding'
import { preloadCaveAssets } from '@/features/rest'
import { hasSeenOnboarding } from './entry'
import { router } from './router'
import { startSessionRestore } from './session'

// 경로는 ./router.tsx, 화면 이동 연결은 ./routes.tsx, 로그인 세션(복원·로그아웃)은 ./session.ts
export default function App() {
  // 스플래시·온보딩·로그인이 떠 있는 동안 뒤에서 곧 보일 화면의 이미지를 순서대로 미리 받아 둔다:
  // 온보딩 그림(아직 안 본 사용자만) → 홈의 섬 → 홈 다음 화면(양 돌보기·우유와 치즈·동굴 문 닫기)
  useEffect(() => {
    // 앱을 열 때 Refresh 쿠키로 로그인 상태를 복원한다. 복원되면 양털 잔액도 미리 받는다(session.ts)
    startSessionRestore()
    if (!hasSeenOnboarding()) preloadOnboardingAssets()
    preloadHomeAssets()
    preloadEmotionAssets()
    preloadCheeseAssets()
    // 동굴 섬 그림 — 홈에서 섬이 옮겨 가는 전환 때 비어 보이지 않게
    preloadCaveAssets()
  }, [])

  return <RouterProvider router={router} />
}
