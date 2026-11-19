import type { GoogleLoginRequest, GoogleLoginResponse } from '@/shared/types'
import { api, hasErrorCode, setAccessToken } from '@/shared/api'
import { consentVersions } from './consent'
import type { SignupConsent } from './consent'

export type GoogleSignupConsent = SignupConsent

export interface GoogleLoginChallenge {
  nonce: string
}

/** GIS를 초기화하기 전에 서버가 발급하는 일회용 nonce와 challenge 쿠키를 받는다. */
export function createGoogleLoginChallenge() {
  return api.post<GoogleLoginChallenge>('/auth/google/challenges', undefined, {
    auth: false,
    withCredentials: true,
  })
}

/** GIS의 Google ID Token을 서비스 토큰으로 교환한다. */
export async function signInWithGoogle(credential: string, consent?: GoogleSignupConsent) {
  const request: GoogleLoginRequest = {
    credential,
    ...(consent && { ...consentVersions, ...consent }),
  }
  const result = await api.post<GoogleLoginResponse>('/auth/google', request, { auth: false })
  setAccessToken(result.accessToken)
  return result
}

export function isGoogleSignupConsentRequired(error: unknown) {
  return hasErrorCode(error, 'AUTH_SIGNUP_CONSENT_REQUIRED')
}

