// 약관 문서 버전. 서버 설정(AuthSettings: TERMS_VERSION·PRIVACY_VERSION·MARKETING_VERSION)과 같아야 한다.
// 가입(auth 기능)과 설정의 마케팅 수신 동의(account 기능)가 함께 쓴다 — 기능끼리 import 하지 않으려고 shared 에 둔다.
// 가입 때 다르면 400 AUTH_REQUIRED_CONSENT_MISSING, 마케팅 동의(true) 때 다르면 409 CONSENT_VERSION_MISMATCH.
export const consentVersions = {
  termsVersion: import.meta.env.VITE_TERMS_VERSION || 'v1',
  privacyVersion: import.meta.env.VITE_PRIVACY_VERSION || 'v1',
  marketingVersion: import.meta.env.VITE_MARKETING_VERSION || 'v1',
}
