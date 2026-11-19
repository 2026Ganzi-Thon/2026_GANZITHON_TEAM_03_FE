import type { MessageResponse, PasswordResetConfirmRequest } from '@/shared/types'
import { api } from '@/shared/api'

// 비밀번호 재설정 API. 응답·오류 코드는 백엔드 PasswordResetController·PasswordResetService 기준(develop 6493ad3).
// 둘 다 비로그인 API 라 토큰을 붙이지 않는다 — 만료된 토큰을 붙이면 공개 API 라도 401 이 난다.

/**
 * 재설정 메일 요청 `POST /auth/password-resets` → 202 `{ message }`.
 * 가입 여부·구글 전용 계정 여부와 상관없이 같은 202 를 준다(메일은 이메일 인증을 마친 일반 로그인 계정에만 감).
 * 오류: 400 COMMON_INVALID_REQUEST(이메일 형식), 429 AUTH_RATE_LIMITED(같은 이메일 60초·같은 IP 분당 상한),
 * 503 AUTH_MAIL_UNAVAILABLE(SMTP·링크 주소 설정 없음, 발송 대기열 가득 참).
 */
export function requestPasswordReset(email: string) {
  return api.post<MessageResponse>('/auth/password-resets', { email }, { auth: false })
}

/**
 * 새 비밀번호 저장 `PATCH /auth/password-resets` → 204. 성공하면 서버가 그 회원의 모든 로그인 세션(Refresh)을 끊는다.
 * 오류: 400 AUTH_PASSWORD_RESET_INVALID(토큰 형식·위조), 400 COMMON_INVALID_REQUEST(빈 토큰 등),
 * 400 AUTH_PASSWORD_POLICY_VIOLATION(비밀번호 규칙 — 토큰은 쓰지 않은 채라 고쳐서 다시 보낼 수 있음),
 * 409 AUTH_PASSWORD_RESET_USED(이미 쓴·새 메일로 폐기된 링크), 410 AUTH_PASSWORD_RESET_EXPIRED(30분 지남).
 */
export function resetPassword(body: PasswordResetConfirmRequest) {
  return api.patch<void>('/auth/password-resets', body, { auth: false })
}
