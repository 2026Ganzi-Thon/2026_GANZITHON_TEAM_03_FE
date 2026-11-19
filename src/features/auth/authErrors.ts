import { NETWORK_ERROR_CODE, TIMEOUT_ERROR_CODE, isApiError } from '@/shared/api'

// 인증 흐름 오류 안내 문구. 서버 메시지가 아니라 status·code 로 고른다(docs/api/common.md).

function fallback(error: unknown, message: string) {
  if (isApiError(error) && (error.code === NETWORK_ERROR_CODE || error.code === TIMEOUT_ERROR_CODE)) return error.message
  return message
}

/** 이메일 로그인 `POST /auth/login` */
export function loginErrorMessage(error: unknown) {
  if (isApiError(error)) {
    if (error.code === 'AUTH_LOGIN_FAILED') return '이메일 또는 비밀번호를 확인해주세요.'
    if (error.code === 'AUTH_RATE_LIMITED') return '로그인 시도가 많아요. 잠시 후 다시 시도해주세요.'
    if (error.code === 'COMMON_INVALID_REQUEST') return '이메일과 비밀번호를 확인해주세요.'
  }
  return fallback(error, '로그인하지 못했어요. 잠시 후 다시 시도해주세요.')
}

/** 인증 메일 발송 `POST /auth/email-verifications` */
export function verificationMailErrorMessage(error: unknown) {
  if (isApiError(error)) {
    if (error.code === 'AUTH_RATE_LIMITED') return '잠시 후 다시 보내주세요. 같은 이메일로는 1분에 한 번 보낼 수 있어요.'
    if (error.code === 'AUTH_MAIL_UNAVAILABLE') return '지금은 인증 메일을 보낼 수 없어요. 잠시 후 다시 시도하거나 Google로 가입해주세요.'
    if (error.code === 'COMMON_INVALID_REQUEST') return '이메일 형식을 확인해주세요.'
  }
  return fallback(error, '인증 메일을 보내지 못했어요. 잠시 후 다시 시도해주세요.')
}

export type ConfirmFailure = 'expired' | 'used' | 'invalid' | 'error'

/** 메일 링크 확인 `POST /auth/email-verifications/confirm` 실패 종류 */
export function confirmFailureOf(error: unknown): ConfirmFailure {
  if (isApiError(error)) {
    if (error.code === 'AUTH_EMAIL_VERIFICATION_EXPIRED') return 'expired'
    if (error.code === 'AUTH_EMAIL_VERIFICATION_USED') return 'used'
    if (error.code === 'AUTH_EMAIL_VERIFICATION_INVALID' || error.code === 'COMMON_INVALID_REQUEST') return 'invalid'
  }
  return 'error'
}

export type SignupFailure = 'verification' | 'duplicated' | 'password' | 'consent' | 'error'

/** 회원가입 `POST /auth/signup` 실패 종류 */
export function signupFailureOf(error: unknown): SignupFailure {
  if (isApiError(error)) {
    if (error.code === 'AUTH_SIGNUP_VERIFICATION_INVALID') return 'verification'
    if (error.code === 'AUTH_EMAIL_DUPLICATED') return 'duplicated'
    if (error.code === 'AUTH_REQUIRED_CONSENT_MISSING') return 'consent'
    if (error.code === 'COMMON_INVALID_REQUEST' && error.fieldErrors.some((field) => field.field === 'password')) return 'password'
  }
  return 'error'
}

export const signupFailureMessages: Record<Exclude<SignupFailure, 'error'>, string> = {
  verification: '이메일 인증 시간(10분)이 지났어요. 인증 메일을 다시 받아주세요.',
  duplicated: '이미 가입된 이메일이에요. 로그인해주세요.',
  password: '비밀번호가 규칙에 맞지 않아요. 비밀번호를 다시 정해주세요.',
  consent: '필수 약관 동의를 확인해주세요.',
}

export function signupErrorMessage(error: unknown) {
  const failure = signupFailureOf(error)
  return failure === 'error' ? fallback(error, '회원가입을 완료하지 못했어요. 잠시 후 다시 시도해주세요.') : signupFailureMessages[failure]
}

/** 비밀번호 재설정 메일 요청 `POST /auth/password-resets` */
export function passwordResetMailErrorMessage(error: unknown) {
  if (isApiError(error)) {
    if (error.code === 'AUTH_RATE_LIMITED') return '잠시 후 다시 보내주세요. 같은 이메일로는 1분에 한 번 보낼 수 있어요.'
    // 배포 서버 SMTP 가 아직 설정되지 않아 지금은 이 안내가 나온다
    if (error.code === 'AUTH_MAIL_UNAVAILABLE') return '지금은 재설정 메일을 보낼 수 없어요. 잠시 후 다시 시도해주세요.'
    if (error.code === 'COMMON_INVALID_REQUEST') return '이메일 형식을 확인해주세요.'
  }
  return fallback(error, '재설정 메일을 보내지 못했어요. 잠시 후 다시 시도해주세요.')
}

/** 새 비밀번호 저장 `PATCH /auth/password-resets` 실패 종류. 링크 문제(expired·used·invalid)는 메일을 다시 받아야 한다 */
export type PasswordResetFailure = 'expired' | 'used' | 'invalid' | 'password' | 'error'

export function passwordResetFailureOf(error: unknown): PasswordResetFailure {
  if (isApiError(error)) {
    if (error.code === 'AUTH_PASSWORD_RESET_EXPIRED') return 'expired'
    if (error.code === 'AUTH_PASSWORD_RESET_USED') return 'used'
    if (error.code === 'AUTH_PASSWORD_RESET_INVALID') return 'invalid'
    if (error.code === 'AUTH_PASSWORD_POLICY_VIOLATION') return 'password'
    // @Valid 오류(빈 토큰·1024자 넘는 비밀번호) — 토큰 쪽이면 링크 문제로 본다
    if (error.code === 'COMMON_INVALID_REQUEST') {
      return error.fieldErrors.some((field) => field.field === 'newPassword') ? 'password' : 'invalid'
    }
  }
  return 'error'
}

export function passwordResetErrorMessage(error: unknown) {
  return fallback(error, '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.')
}
