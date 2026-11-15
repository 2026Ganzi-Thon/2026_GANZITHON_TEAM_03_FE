import { useEffect } from 'react'
import { RouterProvider } from 'react-router'
import { preloadCheeseAssets } from '@/features/cheese'
import { preloadEmotionAssets } from '@/features/emotion'
import { router } from './router'

// 경로는 ./router.tsx, 화면 이동 연결은 ./routes.tsx, 시작 흐름 판단(임시)은 ./entry.ts
export default function App() {
  // 홈에서 양 돌보기로 넘어오는 흐름이라, 앱이 뜨면 뒤에서 양 이미지를 미리 받아 둔다
  useEffect(() => {
    preloadEmotionAssets()
    preloadCheeseAssets()
  }, [])

  return <RouterProvider router={router} />
}
