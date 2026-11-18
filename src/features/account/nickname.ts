// 닉네임 규칙. 백엔드 기준 `[가-힣A-Za-z0-9_]{2,8}`(앞뒤 공백은 잘라서 본다) — docs/api/account.md 의 "2~30자(제안)"보다 백엔드 값이 우선.

export const NICKNAME_PATTERN = /^[가-힣A-Za-z0-9_]{2,8}$/

/** 서버와 같게 앞뒤 공백을 자른다 */
export const normalizeNickname = (nickname: string) => nickname.trim()

export const isValidNickname = (nickname: string) => NICKNAME_PATTERN.test(normalizeNickname(nickname))
