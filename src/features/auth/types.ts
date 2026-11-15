// 인증(auth) 기능 타입. API 요청·응답 타입은 `@/shared/types`에 있고, 여기서는 이 기능이 쓰는 것만 다시 내보낸다.
// 폼 값·화면 상태처럼 이 기능에서만 쓰는 타입을 정의한다. 근거: docs/api/auth.md
import type { AuthUser, GoogleLoginRequest } from '@/shared/types'

export type {
  AuthUser,
  ConfirmEmailRequest,
  ConfirmEmailResponse,
  ConsentInput,
  EmailRequest,
  GoogleLoginRequest,
  GoogleLoginResponse,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  PasswordResetConfirmRequest,
  RefreshResponse,
  SignupRequest,
  SignupResponse,
  TokenResponse,
} from '@/shared/types'

/**
 * 앱의 인증 상태. Access Token은 메모리에만 두므로 새로고침 직후에는
 * 쿠키로 재발급을 시도하기 전까지 `unknown`이다.
 */
export type AuthState =
  | { status: 'unknown' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; accessToken: string; user: AuthUser }

export interface LoginFormValues {
  email: string
  password: string
}

/** 비밀번호 확인·약관 선택은 UI에서만 검사한다(서버도 필수 동의는 다시 검증). */
export interface SignupFormValues {
  email: string
  password: string
  passwordConfirm: string
  /** 필수 */
  termsAgreed: boolean
  /** 필수 */
  privacyAgreed: boolean
  /** 선택 */
  marketingAgreed: boolean
}

/** 회원가입 단계 (제안): 이메일 입력 → 인증 메일 확인 → 비밀번호·약관 입력 */
export type SignupStep = 'email' | 'emailSent' | 'details'

export interface PasswordResetFormValues {
  newPassword: string
  newPasswordConfirm: string
}

/**
 * 구글 신규 사용자가 약관 정보 없이 요청해 409(AUTH_SIGNUP_CONSENT_REQUIRED)를 받았을 때,
 * 동의 화면을 거친 뒤 같은 `credential`로 다시 요청하기 위해 들고 있는 값.
 */
export interface GoogleSignupPending {
  credential: GoogleLoginRequest['credential']
}
