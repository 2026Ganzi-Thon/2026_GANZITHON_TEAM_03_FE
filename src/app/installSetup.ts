import { captureInstallEvents, escapeInAppBrowser, restoreEscapedUrl } from '@/features/pwa-install'

// 앱 설치(PWA) 준비 — main.tsx 가 라우터·화면보다 먼저 import 한다(resetDemo 와 같은 이유: 라우터가 첫 주소를 읽기 전에 고쳐야 해서).
// 1) 인앱 브라우저에서 기본 브라우저로 넘어온 주소를 되돌린다(`#…` 토큰 복원)
// 2) 인앱 브라우저면 기본 브라우저로 한 번 이동을 시도한다
// 3) 크롬이 앱 시작 직후 보내는 설치 이벤트를 놓치지 않게 미리 듣는다

restoreEscapedUrl()
escapeInAppBrowser()
captureInstallEvents()
