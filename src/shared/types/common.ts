// API 공통 타입 - docs/api/common.md 기준

/** 양의 10진수 문자열 ID (예: "101"). DB BIGINT를 문자열로 주고받는다. */
export type Id = string

/** UTC ISO 8601 시각 (예: "2026-11-08T03:00:00Z") */
export type IsoDateTime = string

/** YYYY-MM-DD, Asia/Seoul 기준 날짜 */
export type DateString = string

/** 성공 응답: 본문이 있으면 data로 감싼다. 204는 본문 없음. */
export interface ApiResponse<T> {
  data: T
}

/** 백엔드 global/api/ApiError.FieldError 기준 — 명세 초안의 `reason`이 아니라 `message` */
export interface FieldError {
  field: string
  message: string
}

/** 오류 응답(백엔드 global/api/ApiError). 프론트는 문구가 아니라 HTTP 상태와 code로 분기한다. */
export interface ApiErrorBody {
  code: string
  message: string
  fieldErrors: FieldError[]
}

/** 페이지 방식 목록의 요청 쿼리 (page는 0부터) */
export interface PageParams {
  page?: number
  size?: number
}

/** 페이지 방식 목록의 응답 공통 필드 */
export interface PageInfo {
  page: number
  size: number
  hasNext: boolean
}

/** 페이지 방식 목록 응답의 data */
export interface Paged<T> extends PageInfo {
  items: T[]
}
