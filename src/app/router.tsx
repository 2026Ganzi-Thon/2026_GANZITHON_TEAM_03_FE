import { createBrowserRouter, Navigate } from 'react-router'
import {
  AppShell,
  CheeseRoute,
  ConcernDetailRoute,
  EmotionRecordRoute,
  EmotionRoute,
  EmotionWriteRoute,
  HomeRoute,
  IslandDecorateRoute,
  LoginRoute,
  OnboardingRoute,
  RootLayout,
  SetupRoute,
  SignupRoute,
  SplashRoute,
  TabLayout,
} from './routes'

// 경로 정의는 여기 한곳. 페이지는 콜백 props 만 받고, 이동은 ./routes 의 라우트 요소가 연결한다.
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // 시작 흐름 — 탭바 없음, 가드 없음(이미 통과한 사용자가 주소로 들어와도 막지 않는다)
      { path: 'splash', element: <SplashRoute /> },
      { path: 'onboarding', element: <OnboardingRoute /> },
      { path: 'login', element: <LoginRoute /> },
      { path: 'signup', element: <SignupRoute /> },
      { path: 'setup', element: <SetupRoute /> },
      // 앱 화면 — 시작 흐름 통과 전이면 /splash 로
      {
        element: <AppShell />,
        children: [
          {
            element: <TabLayout />,
            children: [
              { index: true, element: <HomeRoute /> },
              { path: 'emotion', element: <EmotionRoute /> },
              { path: 'cheese', element: <CheeseRoute /> },
            ],
          },
          { path: 'emotion/write', element: <EmotionWriteRoute /> },
          { path: 'emotion/records/:recordId', element: <EmotionRecordRoute /> },
          { path: 'cheese/:concernId', element: <ConcernDetailRoute /> },
          { path: 'island', element: <IslandDecorateRoute /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
