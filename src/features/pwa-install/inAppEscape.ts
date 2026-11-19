// 인앱 브라우저(카카오톡·인스타그램 등 다른 앱 안의 웹뷰)로 들어오면 기기의 기본 브라우저로 같은 주소를 연다.
// 웹뷰에서는 홈 화면에 설치할 수 없고 로그인(구글)도 막히는 일이 많아서다. main.tsx 가 화면을 그리기 전에 부른다.
//
// - 카카오톡(iOS·안드로이드): `kakaotalk://web/openExternal?url=` — 카카오톡이 외부 브라우저로 연다
// - 라인: 주소에 `openExternalBrowser=1` — 라인이 외부 브라우저로 연다
// - 안드로이드의 다른 인앱: `intent://…#Intent;scheme=https;package=com.android.chrome;end` — 크롬으로
// - iOS 의 다른 인앱(인스타그램·페이스북·네이버 등): iOS 17+ 에서 `x-safari-https://` 를 한 번 시도
// 시도는 이 탭에서 한 번만 한다(sessionStorage). 이동하지 못하고 화면이 그대로면 설치 안내 팝업이 "Safari로 열어 주세요"를 보여 준다.
// 근거(공식 문서 아님 — 확인 필요, docs/decisions.md):
//   카카오톡 openExternal — 카카오 데브톡 질문·답변(https://devtalk.kakao.com/t/branch/151358, https://devtalk.kakao.com/t/topic/150815)
//   라인 openExternalBrowser — 라인 개발자 FAQ(외부 브라우저로 열기)
//   안드로이드 intent — https://developer.chrome.com/docs/android/intents
//   x-safari-https — 공개 문서 없음(iOS 17 이후 일부 앱에서 동작한다는 보고만 있음)
// 카카오톡 인앱 창 닫기 스킴(`kakaotalk://inappbrowser/close` 등)은 문서·근거를 찾지 못했고, 외부로 못 연 채 닫히면
// 사용자가 페이지를 잃어 쓰지 않는다 — 인앱 화면에는 앱과 안내 팝업이 남는다.

import { getPlatformInfo, isStandalone } from './platform'
import type { PlatformInfo } from './platform'

const TRIED_KEY = 'polly.inAppEscapeTried'
/** intent:// 는 `#` 뒤를 인텐트 설정으로 쓰므로 원래 주소의 `#…`(메일 인증 토큰 등)은 이 쿼리에 실어 보낸다 */
const HASH_PARAM = '_h'
/** 라인이 외부 브라우저로 열 때 쓰는 표시 — 열린 뒤에는 주소에서 뗀다 */
const LINE_PARAM = 'openExternalBrowser'
const OVERLAY_MS = 2500

/** 외부 브라우저로 넘어온 주소를 원래대로 되돌린다(`_h` → `#…`, `openExternalBrowser` 제거). 라우터가 주소를 읽기 전에 부른다 */
export function restoreEscapedUrl() {
  const url = new URL(window.location.href)
  const hash = url.searchParams.get(HASH_PARAM)
  if (hash === null && !url.searchParams.has(LINE_PARAM)) return
  url.searchParams.delete(HASH_PARAM)
  url.searchParams.delete(LINE_PARAM)
  if (hash !== null && !url.hash) url.hash = hash
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
}

/** 인앱 브라우저에서 기본 브라우저로 열 주소. 확실한 방법이 없으면 null */
export function buildExternalUrl(href: string, platform: PlatformInfo): string | null {
  const target = new URL(href)
  switch (platform.inApp) {
    case null:
      return null
    case 'kakaotalk':
      return `kakaotalk://web/openExternal?url=${encodeURIComponent(target.href)}`
    case 'line':
      target.searchParams.set(LINE_PARAM, '1')
      return target.href
    default:
      if (platform.android) {
        if (target.hash) target.searchParams.set(HASH_PARAM, target.hash)
        // 임의 결정(확인 필요): 크롬을 지정해 연다 — 크롬이 없는 기기는 이동하지 못하고 안내 팝업으로 넘어간다
        return `intent://${target.host}${target.pathname}${target.search}#Intent;scheme=${target.protocol.replace(':', '')};package=com.android.chrome;end`
      }
      if (platform.ios && (platform.iosVersion ?? 0) >= 17) {
        return `x-safari-${target.href}`
      }
      return null
  }
}

function readTried(): boolean | null {
  try {
    return window.sessionStorage.getItem(TRIED_KEY) === '1'
  } catch {
    return null
  }
}

function showOpeningOverlay() {
  const overlay = document.createElement('div')
  overlay.setAttribute('role', 'status')
  overlay.textContent = '기본 브라우저로 여는 중…'
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '1000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg, #fffcf5)',
    color: 'var(--color-text, #1c1c1c)',
    font: '500 16px/1.5 var(--font-family, sans-serif)',
  })
  document.body.appendChild(overlay)
  // 이동하지 못했거나 카카오톡처럼 인앱 화면이 남으면 잠시 뒤 걷고 앱(설치 안내 팝업)을 보여 준다
  window.setTimeout(() => overlay.remove(), OVERLAY_MS)
}

/** 따로 떼어 둔 이동(테스트에서 가로챌 수 있게 `window.__pollyOpenExternal` 이 있으면 그것을 부른다) */
function navigate(url: string) {
  const hook = (window as Window & { __pollyOpenExternal?: (url: string) => void }).__pollyOpenExternal
  if (hook) hook(url)
  else window.location.href = url
}

/**
 * 인앱 브라우저면 기본 브라우저로 이동을 한 번 시도한다. 시도했으면 true.
 * 이미 시도했거나(이 탭에서), sessionStorage 를 못 써 반복을 막을 수 없으면 시도하지 않는다.
 */
export function escapeInAppBrowser(): boolean {
  if (typeof window === 'undefined' || isStandalone()) return false
  const platform = getPlatformInfo()
  if (!platform.inApp) return false
  const tried = readTried()
  if (tried !== false) return false
  const external = buildExternalUrl(window.location.href, platform)
  if (!external) return false
  try {
    window.sessionStorage.setItem(TRIED_KEY, '1')
  } catch {
    return false
  }
  showOpeningOverlay()
  navigate(external)
  return true
}
