// 약관 문서 버전. 서버 설정(AuthSettings)과 같아야 한다 — 다르면 400 AUTH_REQUIRED_CONSENT_MISSING.
// 구글 가입과 이메일 가입이 같은 값을 쓴다.
export const consentVersions = {
  termsVersion: import.meta.env.VITE_TERMS_VERSION || 'v1',
  privacyVersion: import.meta.env.VITE_PRIVACY_VERSION || 'v1',
  marketingVersion: import.meta.env.VITE_MARKETING_VERSION || 'v1',
}

/** 가입 때 받는 동의. 필수 두 항목은 true 만 보낸다 */
export interface SignupConsent {
  termsAgreed: true
  privacyAgreed: true
  marketingAgreed: boolean
}
