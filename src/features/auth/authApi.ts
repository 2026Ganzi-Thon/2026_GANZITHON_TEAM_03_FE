import type { LoginResponse } from '@/shared/types'
import { api, setAccessToken } from '@/shared/api'

export async function signInWithEmail(email: string, password: string) {
  const result = await api.post<LoginResponse>('/auth/login', { email, password }, { auth: false })
  setAccessToken(result.accessToken)
  return result
}
