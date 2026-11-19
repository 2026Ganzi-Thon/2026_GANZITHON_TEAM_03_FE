// Access Token 보관. 메모리에만 둔다 — localStorage·sessionStorage에 저장하지 않는다.
// Refresh Token은 HttpOnly 쿠키라 JS가 읽지 않는다. (docs/api/common.md "확정 사항")

let accessToken: string | null = null
let authLostHandler: (() => void) | null = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token
}

/**
 * 지금 Access Token 의 주인(JWT payload 의 `sub`, 백엔드 AccessTokens 가 회원 id 를 문자열로 넣는다).
 * 서명은 확인하지 않는다 — 이 기기에 저장해 둔 캐시의 주인과 비교하는 데만 쓴다. 토큰이 없거나 읽을 수 없으면 null.
 */
export function getAccessTokenSubject(): string | null {
  const payload = accessToken?.split('.')[1]
  if (!payload) return null
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=')
    const claims = JSON.parse(atob(base64)) as { sub?: unknown }
    return typeof claims.sub === 'string' && claims.sub !== '' ? claims.sub : null
  } catch {
    return null
  }
}

/**
 * 재발급까지 실패해 로그인이 풀렸을 때 호출될 함수를 등록한다.
 * 앱(`app/`)이 로그인 화면으로 보내는 일을 여기에 연결한다.
 */
export function setAuthLostHandler(handler: (() => void) | null) {
  authLostHandler = handler
}

export function notifyAuthLost() {
  accessToken = null
  authLostHandler?.()
}
