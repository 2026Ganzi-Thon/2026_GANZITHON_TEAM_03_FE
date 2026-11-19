import { useEffect, useSyncExternalStore } from 'react'
import { RouterProvider } from 'react-router'
import { preloadGoogleSignIn } from '@/features/auth'
import { preloadCheeseAssets } from '@/features/cheese'
import { preloadEmotionAssets } from '@/features/emotion'
import { preloadHomeAssets } from '@/features/home'
import { preloadOnboardingAssets } from '@/features/onboarding'
import { preloadCaveAssets } from '@/features/rest'
import { PwaInstallPrompt } from '@/features/pwa-install'
import { hasSeenOnboarding } from './entry'
import { router } from './router'
import { startSessionRestore, useSession } from './session'

// 앱 설치 안내를 띄우지 않는 화면 — 스플래시·온보딩 연출, 초기 설정 입력 중, 휴대폰을 엎어 두는 휴식 중
// 임의 결정(확인 필요): 로그인·회원가입 화면이나 앱 화면에 들어와 1.2초 머문 뒤 띄운다(docs/decisions.md)
const NO_INSTALL_PROMPT_PATHS = ['/splash', '/onboarding', '/setup', '/cave/session']

function subscribeLocation(onChange: () => void) {
  return router.subscribe(onChange)
}

function getPathname() {
  return router.state.location.pathname
}

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

  const session = useSession()
  // 로그인 안 된 게 확인되면(스플래시·온보딩이 도는 동안) 구글 버튼에 필요한 스크립트와 challenge 를 미리 받는다 — 로그인 화면에서 버튼이 바로 뜨게
  useEffect(() => {
    if (session.status === 'signedOut') preloadGoogleSignIn()
  }, [session.status])
  const pathname = useSyncExternalStore(subscribeLocation, getPathname)
  // 세션 복원 중에는 곧 스플래시로 옮겨 갈 수 있어 기다린다
  const installPromptReady = session.status !== 'restoring' && !NO_INSTALL_PROMPT_PATHS.includes(pathname)

  return (
    <>
      <RouterProvider router={router} />
      <PwaInstallPrompt ready={installPromptReady} />
    </>
  )
}
