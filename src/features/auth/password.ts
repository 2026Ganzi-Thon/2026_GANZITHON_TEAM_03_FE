// 가입 비밀번호 규칙. 백엔드 PasswordService 기준: 8~64자(유니코드 코드 포인트), 영문 대문자·숫자·특수문자(구두점·기호) 각 1개 이상.
// 로그인은 이 규칙을 강제하지 않는다(서버도 가입 당시 비밀번호와 그대로 비교).

/** 화면에 보여주는 규칙 문구 — 시안 0-4 비밀번호 안내와 같은 문구 */
export const PASSWORD_RULE_TEXT = '8자 이상, 대문자 포함, 숫자 포함, 특수문자 포함'

export const PASSWORD_MAX_LENGTH = 64

export type PasswordRuleKey = 'length' | 'upper' | 'digit' | 'special'

export const PASSWORD_RULES: { key: PasswordRuleKey; label: string }[] = [
  { key: 'length', label: '8자 이상' },
  { key: 'upper', label: '대문자 포함' },
  { key: 'digit', label: '숫자 포함' },
  { key: 'special', label: '특수문자 포함' },
]

// 서버의 [\p{P}\p{S}] 와 같은 범위(유니코드 구두점·기호)
const SPECIAL = /[\p{P}\p{S}]/u

/** 규칙별 통과 여부 */
export function checkPassword(password: string): Record<PasswordRuleKey, boolean> {
  const length = [...password].length
  return {
    length: length >= 8 && length <= PASSWORD_MAX_LENGTH,
    upper: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
    special: SPECIAL.test(password),
  }
}

export function isValidPassword(password: string) {
  return Object.values(checkPassword(password)).every(Boolean)
}
