import { useEffect, useState } from 'react'
import { confirmFailureOf } from './authErrors'
import type { ConfirmFailure } from './authErrors'
import { confirmEmailVerification } from './emailSignupApi'
import { getSignupDraft, isSignupDraftExpired, startSignupDraft } from './signupDraft'

export type EmailConfirmationState =
  | { status: 'confirming' }
  | { status: 'confirmed'; email: string }
  | { status: 'failed'; reason: ConfirmFailure | 'missing' }

function initialState(token: string | null): EmailConfirmationState {
  if (token) return { status: 'confirming' }
  // 토큰 없이 왔으면(비밀번호 단계로 뒤로 가기·새로고침) 메모리에 남은 가입 중 값을 이어 쓴다
  const draft = getSignupDraft()
  if (draft && !draft.signedUp && !isSignupDraftExpired(draft)) return { status: 'confirmed', email: draft.email }
  return { status: 'failed', reason: 'missing' }
}

/**
 * 메일 링크의 토큰을 확인하고 가입 증명을 메모리(signupDraft)에 둔다.
 * 같은 토큰은 한 번만 서버에 보낸다(emailSignupApi 의 중복 방지).
 */
export function useEmailConfirmation(token: string | null) {
  const [state, setState] = useState<EmailConfirmationState>(() => initialState(token))
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!token) return
    let active = true
    confirmEmailVerification(token).then(
      (confirmation) => {
        // 같은 토큰을 두 번 받아도 가입 중 값은 처음 한 번만 새로 만든다(비밀번호 입력 뒤 재마운트 대비)
        if (getSignupDraft()?.signupVerificationToken !== confirmation.signupVerificationToken) startSignupDraft(confirmation)
        if (active) setState({ status: 'confirmed', email: confirmation.email })
      },
      (error: unknown) => {
        if (active) setState({ status: 'failed', reason: confirmFailureOf(error) })
      },
    )
    return () => {
      active = false
    }
  }, [token, attempt])

  /** 네트워크 오류 등으로 확인하지 못했을 때 다시 묻는다 */
  const retry = () => {
    if (!token) return
    setState({ status: 'confirming' })
    setAttempt((value) => value + 1)
  }

  return { state, retry }
}
