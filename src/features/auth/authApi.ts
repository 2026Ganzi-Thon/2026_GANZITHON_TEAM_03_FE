import type { LoginResponse } from '@/shared/types'
import { api, setAccessToken } from '@/shared/api'

export async function signInWithEmail(email: string, password: string) {
  const result = await api.post<LoginResponse>('/auth/login', { email, password }, { auth: false })
  setAccessToken(result.accessToken)
  return result
}

/**
 * 로그아웃 `POST /api/v1/auth/logout`(204, 본문 없음). 서버가 이 세션을 버리고 Refresh 쿠키를 지운다(반복해도 204).
 * 쿠키를 쓰는 인증 API 라 허용 Origin 에서 `withCredentials` 로 보낸다(axios 인스턴스 기본값). 실패해도 메모리 토큰은 지운다.
 */
export async function signOut() {
  try {
    await api.post('/auth/logout', undefined, { auth: false, withCredentials: true })
  } finally {
    setAccessToken(null)
  }
}
