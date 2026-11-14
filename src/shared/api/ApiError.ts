import type { ApiErrorBody, FieldError } from '@/shared/types'

/** 네트워크 오류(서버에 닿지 못함)일 때 `status`는 0, `code`는 이 값이다. */
export const NETWORK_ERROR_CODE = 'NETWORK_ERROR'

/** 오류 본문을 읽지 못했을 때의 `code` */
export const UNKNOWN_ERROR_CODE = 'UNKNOWN_ERROR'

/**
 * API 오류. 프론트는 메시지 문구가 아니라 `status`와 `code`로 분기한다.
 * 근거: docs/api/common.md "응답·오류 처리"
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: FieldError[]

  constructor(status: number, body: Partial<ApiErrorBody> = {}) {
    super(body.message ?? '요청을 처리하지 못했어요.')
    this.name = 'ApiError'
    this.status = status
    this.code = body.code ?? UNKNOWN_ERROR_CODE
    this.fieldErrors = body.fieldErrors ?? []
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** 특정 오류 코드인지 확인한다. 예: `hasErrorCode(e, 'AUTH_SIGNUP_CONSENT_REQUIRED')` */
export function hasErrorCode(error: unknown, code: string): error is ApiError {
  return isApiError(error) && error.code === code
}
