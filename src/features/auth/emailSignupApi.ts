import type { ConfirmEmailResponse, MessageResponse, SignupRequest, SignupResponse } from '@/shared/types'
import { api, setAccessToken } from '@/shared/api'
import { consentVersions } from './consent'
import type { SignupConsent } from './consent'

// 이메일 회원가입 API. 응답·오류 코드는 백엔드 EmailVerificationController·LocalAuthController 기준(docs/email-verification.md).

/**
 * 인증 메일 발송 `POST /auth/email-verifications` → 202.
 * 오류: 400 COMMON_INVALID_REQUEST(형식), 429 AUTH_RATE_LIMITED(같은 이메일 60초·같은 IP 분당 상한), 503 AUTH_MAIL_UNAVAILABLE.
 */
export function sendVerificationEmail(email: string) {
  return api.post<MessageResponse>('/auth/email-verifications', { email }, { auth: false })
}

// 같은 토큰의 확인은 한 번만 보낸다 — 확인이 메일 토큰을 소비해서 두 번째 호출은 409 USED 가 된다
// (React StrictMode 의 이중 effect, 화면 재마운트 모두 같은 결과를 받게)
const confirmations = new Map<string, Promise<ConfirmEmailResponse>>()

/**
 * 메일 링크의 토큰 확인 `POST /auth/email-verifications/confirm` → 200 `{ email, signupVerificationToken, expiresIn: 600 }`.
 * 오류: 400 AUTH_EMAIL_VERIFICATION_INVALID, 409 AUTH_EMAIL_VERIFICATION_USED, 410 AUTH_EMAIL_VERIFICATION_EXPIRED.
 */
export function confirmEmailVerification(token: string) {
  let pending = confirmations.get(token)
  if (!pending) {
    pending = api.post<ConfirmEmailResponse>('/auth/email-verifications/confirm', { token }, { auth: false })
    // 실패는 기억하지 않는다 — 네트워크 오류 뒤 "다시 시도"가 서버에 다시 묻게
    pending.catch(() => confirmations.delete(token))
    confirmations.set(token, pending)
  }
  return pending
}

export interface EmailSignupInput {
  email: string
  password: string
  signupVerificationToken: string
  consent: SignupConsent
}

/**
 * 일반 회원가입 `POST /auth/signup` → 201, 로그인 세션 발급(Access Token + Refresh 쿠키, 구글 로그인과 같은 응답).
 * 오류: 400 COMMON_INVALID_REQUEST(fieldErrors password), 400 AUTH_REQUIRED_CONSENT_MISSING,
 * 401 AUTH_SIGNUP_VERIFICATION_INVALID(가입 증명 만료·사용·불일치), 409 AUTH_EMAIL_DUPLICATED.
 * 비밀번호·약관 오류는 서버가 가입 증명을 쓰지 않은 채로 돌려준다(같은 트랜잭션이 롤백) — 고쳐서 다시 보낼 수 있다.
 */
export async function signUpWithEmail({ email, password, signupVerificationToken, consent }: EmailSignupInput) {
  const request: SignupRequest = { email, password, signupVerificationToken, ...consentVersions, ...consent }
  const result = await api.post<SignupResponse>('/auth/signup', request, { auth: false, withCredentials: true })
  setAccessToken(result.accessToken)
  return result
}
