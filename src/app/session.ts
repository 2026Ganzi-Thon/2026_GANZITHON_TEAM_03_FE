import { useSyncExternalStore } from 'react'
import { myInfoQueryOptions } from '@/features/account'
import { signOut as requestSignOut } from '@/features/auth'
import { hasErrorCode, isApiError, restoreSession, setAccessToken, setAuthLostHandler } from '@/shared/api'
import { woolBalanceQueryOptions } from '@/shared/wool'
import { queryClient } from './queryClient'

// 로그인 세션 — 앱 화면에 들어갈 수 있는지를 "Access Token 이 있는지(로그인)"와 "초기 설정을 마쳤는지"로 본다.
// Access Token 은 메모리에만 있어서(shared/api/token.ts) 앱을 열 때마다 Refresh 쿠키로 다시 받는다(restoreSession).
//
// - restoring: 앱을 막 열어 쿠키로 복원하는 중. 앱 화면은 아무것도 그리지 않고 기다린다(깜빡임 없이, 보통 수백 ms).
// - signedOut: 로그인 안 됨. reason 이 'initial'(앱을 열었는데 세션 없음)이면 시작 흐름(스플래시)부터,
//              'lost'(재발급 실패 등으로 풀림)·'logout'(계정 바꾸기)이면 로그인 화면으로.
// - needsSetup: 로그인은 됐지만 초기 설정(닉네임) 전 — 초기 설정 화면으로.
// - ready: 앱 화면에 들어갈 수 있다.

export type SignedOutReason = 'initial' | 'lost' | 'logout'

export type SessionState =
  | { status: 'restoring' }
  | { status: 'signedOut'; reason: SignedOutReason }
  | { status: 'needsSetup' }
  | { status: 'ready' }

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

/** 로그인(또는 복원)한 뒤 초기 설정 여부에 따라 세션을 연다. */
export function openSession(profileCompleted: boolean) {
  setState(profileCompleted ? { status: 'ready' } : { status: 'needsSetup' })
  if (profileCompleted) prefetchAppData()
}

/**
 * 세션을 닫는다(로그인 화면·시작 흐름으로). 메모리 토큰을 지우고, 다른 계정의 값이 남지 않게 서버 데이터 캐시를 비운다.
 * 캐시는 앱 화면이 내려간 뒤에 비운다 — 화면이 남아 있는 동안 비우면 그 화면이 토큰 없이 다시 받으려 한다.
 */
function closeSession(reason: SignedOutReason) {
  setAccessToken(null)
  if (state.status === 'signedOut') return
  setState({ status: 'signedOut', reason })
  window.setTimeout(() => queryClient.clear(), 0)
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

/**
 * 앱을 열 때 한 번: Refresh 쿠키로 Access Token 을 다시 받고, 받았으면 내 정보로 초기 설정 여부를 확인한다.
 * 내 정보를 못 받은 경우(네트워크 등)는 초기 설정을 마친 것으로 보고 앱 화면으로 — 각 화면이 자기 오류를 보여준다.
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

  void (async () => {
    if (!(await restoreSession())) {
      if (stillRestoring()) setState({ status: 'signedOut', reason: 'initial' })
      return
    }
    try {
      const me = await queryClient.fetchQuery(myInfoQueryOptions())
      if (stillRestoring()) openSession(me.profileCompleted)
    } catch (error) {
      if (!stillRestoring()) return
      // 토큰이 거절됐거나 회원이 없어졌으면 로그인 안 된 것으로
      if ((isApiError(error) && error.status === 401) || hasErrorCode(error, 'USER_NOT_FOUND')) {
        setAccessToken(null)
        setState({ status: 'signedOut', reason: 'initial' })
      } else {
        openSession(true)
      }
    }
  })()
}
