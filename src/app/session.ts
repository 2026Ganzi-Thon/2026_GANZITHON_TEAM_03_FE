import { useSyncExternalStore } from 'react'
import { accountKeys, completeOnboarding, myInfoQueryOptions } from '@/features/account'
import type { MyInfo } from '@/features/account'
import { signOut as requestSignOut } from '@/features/auth'
import {
  getAccessTokenSubject,
  hasErrorCode,
  isApiError,
  refreshAccessToken,
  setAccessToken,
  setAuthLostHandler,
} from '@/shared/api'
import { woolBalanceQueryOptions } from '@/shared/wool'
import { hasSeenOnboarding, markOnboardingSeen } from './entry'
import { queryClient } from './queryClient'
import {
  clearPersistedQueryCache,
  prereadPersistedQueryCache,
  restorePersistedQueryCache,
  startQueryPersist,
} from './queryPersist'

// 로그인 세션 — 앱 화면에 들어갈 수 있는지를 "Access Token 이 있는지(로그인)"와 "초기 설정을 마쳤는지"로 본다.
// Access Token 은 메모리에만 있어서(shared/api/token.ts) 앱을 열 때마다 Refresh 쿠키로 다시 받는다(startSessionRestore).
// 서버 데이터 캐시는 IndexedDB 에 저장해 두었다가 같은 사용자로 복원되면 되살린다(./queryPersist.ts) — 세션을 닫으면 지운다.
//
// - restoring: 앱을 막 열어 쿠키로 복원하는 중. 앱 화면은 아무것도 그리지 않고 기다린다(깜빡임 없이, 보통 수백 ms).
// - signedOut: 로그인 안 됨. reason 이 'initial'(앱을 열었는데 세션 없음)이면 시작 흐름(스플래시)부터,
//              'lost'(재발급 실패 등으로 풀림)·'logout'(계정 바꾸기)이면 로그인 화면으로.
// - needsSetup: 로그인은 됐지만 초기 설정(닉네임) 전 — 초기 설정 화면으로.
// - ready: 앱 화면에 들어갈 수 있다. needsOnboarding 이면 먼저 온보딩을 보여준다(아래 "온보딩 완료").

export type SignedOutReason = 'initial' | 'lost' | 'logout'

export type SessionState =
  | { status: 'restoring' }
  | { status: 'signedOut'; reason: SignedOutReason }
  | { status: 'needsSetup' }
  | { status: 'ready'; needsOnboarding: boolean }

let state: SessionState = { status: 'restoring' }
const listeners = new Set<() => void>()

function setState(next: SessionState) {
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSession(): SessionState {
  return state
}

/** 지금 세션 상태. 바뀌면 다시 그린다 */
export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSession)
}

/** 앱 화면에 들어가면 여러 화면 머리에 나오는 양털 잔액을 먼저 받아 둔다 — 숫자 자리가 비지 않게 */
function prefetchAppData() {
  void queryClient.prefetchQuery(woolBalanceQueryOptions())
}

// ── 온보딩 완료 ──────────────────────────────────────────
// 온보딩은 보통 로그인 전에 본다(스플래시 → 온보딩 → 로그인). 이 기기에서 봤는지는 localStorage(./entry.ts),
// 계정이 봤는지는 서버(`onboardingCompleted`, `PATCH /users/me/onboarding`). 로그인·복원할 때 둘을 맞춘다:
// - 서버가 완료 → 이 기기에도 본 것으로 적는다(다음에 스플래시 뒤 온보딩을 건너뛰고 로그인으로)
// - 서버는 미완료인데 이 기기에서 봤음(로그인 전에 봄) → 서버에 완료를 저장(뒤에서, 기다리지 않음). 실패하면 다음 로그인·복원 때 다시
// - 둘 다 아님(로그인 화면으로 바로 들어옴·새 기기에서 처음 로그인) → 앱 화면 대신 온보딩을 먼저 보여준다(AppShell)
// 건너뛰기도 완료로 본다(docs/api/account.md 추천).

/** 서버가 알려 준 온보딩 완료 여부. 모르면 undefined(내 정보를 못 받음 등 — 다시 띄우지 않는다) */
let serverOnboardingCompleted: boolean | undefined
let onboardingSaving: Promise<void> | null = null

function saveOnboardingCompleted() {
  onboardingSaving ??= completeOnboarding()
    .then((result) => {
      serverOnboardingCompleted = result.onboardingCompleted
      queryClient.setQueryData<MyInfo>(accountKeys.me(), (old) => (old ? { ...old, onboardingCompleted: true } : old))
    })
    .catch(() => {
      // 다음 로그인·복원 때 다시 저장한다(이 기기에는 본 기록이 남아 있다)
    })
    .finally(() => {
      onboardingSaving = null
    })
}

/** 로그인·복원 때 서버 값과 이 기기 기록을 맞추고, 온보딩을 먼저 보여줘야 하는지 돌려준다 */
function reconcileOnboarding(): boolean {
  if (serverOnboardingCompleted !== false) {
    if (serverOnboardingCompleted) markOnboardingSeen()
    return false
  }
  if (hasSeenOnboarding()) {
    saveOnboardingCompleted()
    return false
  }
  return true
}

/** 로그인한 채로 온보딩을 끝내거나 건너뛰었을 때 — 이 기기·서버에 저장하고 앱 화면을 연다 */
export function finishOnboarding() {
  markOnboardingSeen()
  if (state.status === 'restoring' || state.status === 'signedOut') return
  if (serverOnboardingCompleted !== true) saveOnboardingCompleted()
  if (state.status === 'ready' && state.needsOnboarding) setState({ status: 'ready', needsOnboarding: false })
}

/**
 * 로그인(또는 복원)한 뒤 초기 설정 여부에 따라 세션을 연다.
 * onboardingCompleted 는 로그인·가입 응답이나 내 정보의 값. 넘기지 않으면 이전에 받은 값을 그대로 쓴다(초기 설정 완료 등).
 */
export function openSession(profileCompleted: boolean, onboardingCompleted?: boolean) {
  if (onboardingCompleted !== undefined) serverOnboardingCompleted = onboardingCompleted
  const needsOnboarding = reconcileOnboarding()
  // 토큰의 주인(회원 id)으로 캐시 저장을 시작한다. 복원 때 되살린 주인과 다르면 남은 저장본을 먼저 지운다
  startQueryPersist(getAccessTokenSubject())
  setState(profileCompleted ? { status: 'ready', needsOnboarding } : { status: 'needsSetup' })
  if (profileCompleted) prefetchAppData()
}

/**
 * 세션을 닫는다(로그인 화면·시작 흐름으로). 메모리 토큰을 지우고, 다른 계정의 값이 남지 않게 서버 데이터 캐시를 비운다.
 * IndexedDB 저장본은 바로 지우고(저장도 멈춤), 메모리 캐시는 앱 화면이 내려간 뒤에 비운다 — 화면이 남아 있는 동안 비우면
 * 그 화면이 토큰 없이 다시 받으려 한다.
 */
function closeSession(reason: SignedOutReason) {
  setAccessToken(null)
  clearPersistedQueryCache()
  serverOnboardingCompleted = undefined
  if (state.status === 'signedOut') return
  setState({ status: 'signedOut', reason })
  window.setTimeout(() => queryClient.clear(), 0)
}

/**
 * 비밀번호를 재설정한 뒤: 서버가 이 회원의 로그인 세션(Refresh)을 모두 끊었으므로 이 기기의 세션도 닫는다.
 * 로그인돼 있지 않았으면 아무 일도 하지 않는다.
 */
export function closeSessionAfterPasswordReset() {
  if (state.status === 'restoring') {
    setAccessToken(null)
    clearPersistedQueryCache()
    return
  }
  if (state.status !== 'signedOut') closeSession('logout')
}

/** "계정 바꾸기": 서버 로그아웃(쿠키 지움) 뒤 세션을 닫는다. 서버 호출이 실패해도 이 기기에서는 로그아웃한다. */
export async function logout() {
  try {
    await requestSignOut()
  } catch {
    // 네트워크 오류 등 — 메모리 토큰은 signOut 이 지웠다
  }
  closeSession('logout')
}

let restoreStarted = false

/** 재발급 실패가 "로그인 안 됨"으로 확실한가 — 서버가 거절(4xx). 응답을 못 받음·5xx 는 확실하지 않아 저장본을 남긴다 */
const isSignedOutForSure = (error: unknown) => isApiError(error) && error.status >= 400 && error.status < 500

/**
 * 앱을 열 때 한 번: Refresh 쿠키로 Access Token 을 다시 받고, 받았으면 내 정보로 초기 설정 여부를 확인한다.
 * 내 정보를 못 받은 경우(네트워크 등)는 초기 설정을 마친 것으로 보고 앱 화면으로 — 각 화면이 자기 오류를 보여준다.
 *
 * 토큰을 받으면 그 주인(JWT sub)의 IndexedDB 저장본을 되살린다(./queryPersist.ts). 되살린 내 정보가 초기 설정·온보딩을 마친
 * 같은 회원이면 내 정보를 기다리지 않고 바로 세션을 열고(두 값은 true 에서 false 로 돌아가지 않는다) 내 정보는 뒤에서 다시 받는다.
 */
export function startSessionRestore() {
  if (restoreStarted) return
  restoreStarted = true

  // 재발급까지 실패해 로그인이 풀리면(또는 토큰이 거절되면) 로그인 화면으로. 복원 중의 실패는 아래에서 처리한다
  setAuthLostHandler(() => {
    if (state.status === 'restoring') return
    closeSession('lost')
  })

  // 복원이 늦게 끝나는 동안 사용자가 로그인 화면에서 직접 로그인했으면 그 결과를 덮지 않는다
  const stillRestoring = () => state.status === 'restoring'

  // 저장본은 토큰 재발급과 함께 미리 읽어 둔다(메모리에만, 주인 확인 전에는 캐시에 넣지 않는다)
  prereadPersistedQueryCache()

  void (async () => {
    try {
      await refreshAccessToken()
    } catch (error) {
      if (!stillRestoring()) return
      // 로그인 풀림(재발급 거절) — 저장본도 지운다
      if (isSignedOutForSure(error)) clearPersistedQueryCache()
      setState({ status: 'signedOut', reason: 'initial' })
      return
    }
    if (!stillRestoring()) return

    const owner = getAccessTokenSubject()
    const cachedMe = await restorePersistedQueryCache(owner, stillRestoring)
    if (!stillRestoring()) return
    if (cachedMe && cachedMe.userId === owner && cachedMe.profileCompleted && cachedMe.onboardingCompleted) {
      openSession(true, true)
      void queryClient.fetchQuery(myInfoQueryOptions()).catch((error: unknown) => {
        // 회원이 없어졌으면 로그인 풀림으로(토큰 거절은 setAuthLostHandler 가 처리한다)
        if (hasErrorCode(error, 'USER_NOT_FOUND')) closeSession('lost')
      })
      return
    }

    try {
      const me = await queryClient.fetchQuery(myInfoQueryOptions())
      if (stillRestoring()) openSession(me.profileCompleted, me.onboardingCompleted)
    } catch (error) {
      if (!stillRestoring()) return
      // 토큰이 거절됐거나 회원이 없어졌으면 로그인 안 된 것으로
      if ((isApiError(error) && error.status === 401) || hasErrorCode(error, 'USER_NOT_FOUND')) {
        setAccessToken(null)
        clearPersistedQueryCache()
        queryClient.clear()
        setState({ status: 'signedOut', reason: 'initial' })
      } else {
        openSession(true)
      }
    }
  })()
}
