import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { woolBalanceQueryOptions } from '@/shared/wool'
import { preloadCheeseAssets } from '@/features/cheese'
import { preloadEmotionAssets } from '@/features/emotion'
import { preloadHomeAssets } from '@/features/home'
import { preloadOnboardingAssets } from '@/features/onboarding'
import { hasSeenOnboarding } from './entry'
import { queryClient } from './queryClient'
import { router } from './router'

// 경로는 ./router.tsx, 화면 이동 연결은 ./routes.tsx, 시작 흐름 판단(임시)은 ./entry.ts
export default function App() {
  // 스플래시·온보딩·로그인이 떠 있는 동안 뒤에서 곧 보일 화면의 이미지를 순서대로 미리 받아 둔다:
  // 온보딩 그림(아직 안 본 사용자만) → 홈의 섬 → 홈 다음 화면(양 돌보기·우유와 치즈)
  useEffect(() => {
    // 양털 잔액은 여러 화면 머리에 나와서 시작 흐름 동안 먼저 받아 둔다 — 앱 화면에 들어갔을 때 숫자 자리가 비지 않게
    void queryClient.prefetchQuery(woolBalanceQueryOptions())
    if (!hasSeenOnboarding()) preloadOnboardingAssets()
    preloadHomeAssets()
    preloadEmotionAssets()
    preloadCheeseAssets()
  }, [])

  return <RouterProvider router={router} />
}
