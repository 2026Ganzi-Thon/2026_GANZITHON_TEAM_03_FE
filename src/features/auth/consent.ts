// 약관 문서 버전은 설정 화면(마케팅 수신 동의)도 써서 shared 로 옮겼다. 구글 가입과 이메일 가입이 같은 값을 쓴다.
export { consentVersions } from '@/shared/lib/consentVersions'

/** 가입 때 받는 동의. 필수 두 항목은 true 만 보낸다 */
export interface SignupConsent {
  termsAgreed: true
  privacyAgreed: true
  marketingAgreed: boolean
}
