import type { GoogleLoginRequest, GoogleLoginResponse } from '@/shared/types'
import { api, hasErrorCode, setAccessToken } from '@/shared/api'

const consentVersions = {
  termsVersion: import.meta.env.VITE_TERMS_VERSION || 'v1',
  privacyVersion: import.meta.env.VITE_PRIVACY_VERSION || 'v1',
  marketingVersion: import.meta.env.VITE_MARKETING_VERSION || 'v1',
}

export interface GoogleSignupConsent {
  termsAgreed: true
  privacyAgreed: true
  marketingAgreed: boolean
}

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

