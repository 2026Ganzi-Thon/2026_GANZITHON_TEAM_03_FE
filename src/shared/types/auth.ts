// 회원 - 인증 API 타입 - docs/api/auth.md 기준

/** 이메일 인증 메일 발송 / 비밀번호 재설정 메일 발송 요청 */
export interface EmailRequest {
  email: string
}

/** 202 응답의 data (이메일 인증 메일 발송, 비밀번호 재설정 메일 발송) */
export interface MessageResponse {
  message: string
}

export interface ConfirmEmailRequest {
  token: string
}

export interface ConfirmEmailResponse {
  email: string
  signupVerificationToken: string
  /** 초 단위 (예: 600) */
  expiresIn: number
}

/** 약관 동의 입력. true만 허용되는 항목: termsAgreed, privacyAgreed */
export interface ConsentInput {
  termsVersion: string
  termsAgreed: boolean
  privacyVersion: string
  privacyAgreed: boolean
  /** 선택 동의. false여도 가입 가능 */
  marketingVersion: string
  marketingAgreed: boolean
}

export interface SignupRequest extends ConsentInput {
  email: string
  password: string
  signupVerificationToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

/** 구글 ID Token. 신규 가입일 때만 약관 정보가 필요하다(없으면 409). */
export interface GoogleLoginRequest extends Partial<ConsentInput> {
  credential: string
}

export interface AuthUser {
  userId: string
  /** 초기 설정 전이면 null */
  nickname: string | null
  profileCompleted: boolean
  onboardingCompleted: boolean
}

/** Refresh Token은 응답 JSON이 아니라 Set-Cookie로 온다. */
export interface TokenResponse {
  accessToken: string
  tokenType: 'Bearer'
  /** 초 단위 (3600) */
  expiresIn: number
}

/** 로그인 응답의 data */
export interface LoginResponse extends TokenResponse {
  user: AuthUser
}

/** 회원가입(201)·구글 로그인(200 기존 / 201 신규) 응답의 data */
export interface SignupResponse extends LoginResponse {
  isNewUser: boolean
}

export type GoogleLoginResponse = SignupResponse

/** 토큰 재발급 응답의 data */
export type RefreshResponse = TokenResponse

export interface PasswordResetConfirmRequest {
  token: string
  newPassword: string
}
