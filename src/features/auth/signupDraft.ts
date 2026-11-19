// 이메일 가입 중인 값. **메모리에만** 둔다 — 비밀번호·가입 증명을 localStorage·sessionStorage·라우트 state(history.state)에
// 남기지 않는다. 새로고침하거나 탭을 닫으면 사라지고, 그때는 인증 메일을 다시 받는다.
//
// 흐름: 메일 링크 확인(/verify-email) → confirmation 저장 → 비밀번호 입력 → password 저장 → 초기 설정(/setup)에서
// 약관과 함께 가입 → signedUp 표시(비밀번호는 지움) → 초기 프로필 저장. 프로필 저장이 실패해도 가입을 다시 부르지 않는다.

export interface SignupDraft {
  email: string
  signupVerificationToken: string
  /** 가입 증명 만료 시각(ms). 서버 expiresIn(600초) 기준 */
  expiresAt: number
  password: string | null
  /** 가입(POST /auth/signup)을 마쳤는지 — 초기 설정 저장만 다시 하면 된다 */
  signedUp: boolean
}

let draft: SignupDraft | null = null

export function getSignupDraft() {
  return draft
}

/** 메일 링크 확인이 끝났을 때 — 이전 가입 중 값은 버린다 */
export function startSignupDraft(confirmation: { email: string; signupVerificationToken: string; expiresIn: number }) {
  draft = {
    email: confirmation.email,
    signupVerificationToken: confirmation.signupVerificationToken,
    expiresAt: Date.now() + confirmation.expiresIn * 1000,
    password: null,
    signedUp: false,
  }
}

export function setSignupPassword(password: string) {
  if (draft) draft = { ...draft, password }
}

export function markSignedUp() {
  if (draft) draft = { ...draft, password: null, signupVerificationToken: '', signedUp: true }
}

export function clearSignupDraft() {
  draft = null
}

/** 가입 증명이 만료됐는지(여유 5초) */
export function isSignupDraftExpired(value: SignupDraft) {
  return Date.now() > value.expiresAt - 5_000
}

// 이 탭에서 마지막으로 인증 메일을 보낸 이메일 — 링크가 만료·사용됨일 때 "인증 메일 다시 받기"에 채워 준다(메모리만)
let lastSentEmail: string | null = null

export function rememberSentEmail(email: string) {
  lastSentEmail = email
}

/** 다시 받기 화면에 채울 이메일: 가입 중인 이메일 → 이 탭에서 보낸 이메일 */
export function getResendEmail() {
  return draft?.email ?? lastSentEmail ?? ''
}
