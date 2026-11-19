// 앱 설치 안내(PWA). 붙이는 곳은 app/ — main.tsx(이벤트 받기·인앱 탈출)와 App.tsx(팝업)
export { PwaInstallPrompt } from './PwaInstallPrompt'
export type { PwaInstallPromptProps } from './PwaInstallPrompt'
export { captureInstallEvents } from './installEvent'
export { escapeInAppBrowser, restoreEscapedUrl } from './inAppEscape'
