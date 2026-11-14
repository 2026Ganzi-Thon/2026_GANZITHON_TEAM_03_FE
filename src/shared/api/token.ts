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
