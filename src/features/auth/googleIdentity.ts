import { createGoogleLoginChallenge } from './googleAuth'
import type { GoogleLoginChallenge } from './googleAuth'

// Google Identity Services(GIS) 스크립트 불러오기와 로그인 challenge 준비. 버튼(GoogleIdentityButton)과 미리 받기가 함께 쓴다.

export interface GoogleCredentialResponse {
  credential?: string
}

interface GoogleButtonOptions {
  theme: 'outline'
  size: 'large'
  text: 'continue_with'
  shape: 'rectangular'
  logo_alignment: 'left'
  width: number
  locale: 'ko'
}

interface GoogleIdentityApi {
  initialize(options: {
    client_id: string
    nonce: string
    callback: (response: GoogleCredentialResponse) => void
    ux_mode: 'popup'
  }): void
  renderButton(element: HTMLElement, options: GoogleButtonOptions): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } }
  }
}

let scriptPromise: Promise<void> | undefined

export function loadGoogleIdentityScript() {
  if (window.google?.accounts.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('#google-identity-services')
    const script = existing ?? document.createElement('script')

    const handleLoad = () => {
      if (window.google?.accounts.id) resolve()
      else reject(new Error('Google 로그인 스크립트를 불러오지 못했어요.'))
    }
    const handleError = () => {
      script.remove()
      reject(new Error('Google 로그인 스크립트를 불러오지 못했어요.'))
    }

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
    if (!existing) {
      script.id = 'google-identity-services'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.append(script)
    }
  }).catch((error: unknown) => {
    scriptPromise = undefined
    throw error
  })

  return scriptPromise
}

// ── 미리 준비 ─────────────────────────────────────────────
// 버튼은 GIS 스크립트와 서버 challenge(nonce) 둘 다 있어야 그릴 수 있다. 로그인 화면에 들어와서야 받기 시작하면
// 버튼이 늦게 뜨므로, 스플래시·온보딩 때 미리 받아 둔다(preloadGoogleSignIn). challenge 는 서버에서 5분 유효하고
// 한 번 쓰면 끝이라, 4분이 지났거나 한 번 쓴 것은 새로 받는다.
const CHALLENGE_REUSE_MS = 4 * 60 * 1000

let challengeCache: { promise: Promise<GoogleLoginChallenge>; createdAt: number } | undefined

export function getChallenge() {
  if (!challengeCache || Date.now() - challengeCache.createdAt > CHALLENGE_REUSE_MS) {
    const promise = createGoogleLoginChallenge()
    challengeCache = { promise, createdAt: Date.now() }
    // 실패한 것은 다음에 다시 받게 비운다
    promise.catch(() => {
      if (challengeCache?.promise === promise) challengeCache = undefined
    })
  }
  return challengeCache.promise
}

/** 쓴 challenge 를 버린다(같은 nonce 로 다시 로그인할 수 없다) */
export function discardChallenge() {
  challengeCache = undefined
}

/** 로그인 화면이 뜨기 전에 GIS 스크립트와 challenge 를 미리 받는다. 실패해도 버튼이 다시 시도한다 */
export function preloadGoogleSignIn() {
  void loadGoogleIdentityScript().catch(() => {})
  void getChallenge().catch(() => {})
}

