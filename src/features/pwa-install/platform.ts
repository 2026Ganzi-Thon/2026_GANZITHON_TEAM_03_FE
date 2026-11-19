// 이 기기·브라우저가 어떤 설치 방법을 쓰는지 판별하는 곳(UA 판별은 여기 한곳에만 둔다).

/** 인앱 브라우저(다른 앱 안의 웹뷰) 종류 */
export type InAppKind = 'kakaotalk' | 'line' | 'instagram' | 'facebook' | 'naver' | 'daum' | 'webview'

export interface PlatformInfo {
  /** iPhone·iPad(맥처럼 보이는 iPadOS 포함) */
  ios: boolean
  android: boolean
  /** iOS 의 Safari 자체(크롬·파이어폭스·인앱 아님) — 공유 → 홈 화면에 추가로 설치할 수 있다 */
  iosSafari: boolean
  /** 인앱 브라우저면 그 종류, 아니면 null */
  inApp: InAppKind | null
  /** iOS 주 버전(모르면 null) */
  iosVersion: number | null
}

function readUserAgent(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent
}

/** iPadOS 13+ 의 Safari 는 맥(MacIntel)으로 보이므로 터치 지점 수로 가른다 */
function isIPadOSDesktopMode(ua: string): boolean {
  if (typeof navigator === 'undefined') return false
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
}

function detectInApp(ua: string, android: boolean): InAppKind | null {
  if (/KAKAOTALK/i.test(ua)) return 'kakaotalk'
  if (/\bLine\//.test(ua)) return 'line'
  if (/Instagram/.test(ua)) return 'instagram'
  if (/FBAN|FBAV|FB_IAB|FBIOS/.test(ua)) return 'facebook'
  if (/NAVER\(inapp/.test(ua)) return 'naver'
  if (/DaumApps/.test(ua)) return 'daum'
  // 안드로이드 시스템 웹뷰(이름을 모르는 앱 안) — UA 에 "; wv)" 가 붙는다
  if (android && /;\s?wv\)/.test(ua)) return 'webview'
  return null
}

export function getPlatformInfo(ua: string = readUserAgent()): PlatformInfo {
  const ios = /iPhone|iPad|iPod/.test(ua) || isIPadOSDesktopMode(ua)
  const android = !ios && /Android/.test(ua)
  const inApp = detectInApp(ua, android)
  // iOS 의 다른 브라우저: 크롬(CriOS)·파이어폭스(FxiOS)·엣지(EdgiOS)·오페라(OPiOS)·웨일 등
  const iosOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|Whale|YaBrowser|DuckDuckGo|GSA\//.test(ua)
  const iosSafari = ios && !inApp && !iosOtherBrowser && /Safari/.test(ua)
  const versionMatch = /OS (\d+)[_.]\d+/.exec(ua) ?? /Version\/(\d+)/.exec(ua)
  const iosVersion = ios && versionMatch ? Number(versionMatch[1]) : null
  return { ios, android, iosSafari, inApp, iosVersion }
}

/** 홈 화면에 설치한 앱으로 열렸는지 — 그렇다면 설치 안내를 띄우지 않는다 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  if (nav.standalone === true) return true
  if (typeof window.matchMedia !== 'function') return false
  return ['standalone', 'fullscreen', 'minimal-ui', 'window-controls-overlay'].some(
    (mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
  )
}
