import { api } from '@/shared/api'
import type {
  ConcernDetail,
  ConcernListResponse,
  CreateReplyRequest,
  CreateReplyResponse,
  ConcernRepliesResponse,
  MyConcernListParams,
  MyConcernListResponse,
  OpenConcernResponse,
} from './types'

// 고민·위로(치즈) API. 응답·오류 코드는 백엔드 ConcernController·ConcernService·ComfortReplyService·CheeseService 기준.
// 목록(위로할 고민·내 고민)의 preview 는 서버가 본문 앞 100자로 자른다 — 본문 전체는 상세(GET /concerns/{id})에서 받는다.

/** 위로 작성: 이미 남긴 고민(409) */
export const REPLY_ALREADY_EXISTS = 'REPLY_ALREADY_EXISTS'
/** 위로 작성: 숙성이 끝났거나 개봉돼 위로를 받지 않는 고민(409) */
export const CONCERN_REPLY_CLOSED = 'CONCERN_REPLY_CLOSED'
/** 없거나 삭제된 고민, 내 고민 전용 API 에서는 내 고민이 아님(404) */
export const CONCERN_NOT_FOUND = 'CONCERN_NOT_FOUND'
/** 위로 작성: 내 고민(403) */
export const REPLY_OWN_CONCERN_FORBIDDEN = 'REPLY_OWN_CONCERN_FORBIDDEN'
/** 개봉: 아직 숙성 중(409) */
export const CONCERN_NOT_MATURED = 'CONCERN_NOT_MATURED'
/** 받은 위로 조회: 아직 개봉 전(409) */
export const CONCERN_NOT_OPENED = 'CONCERN_NOT_OPENED'

const path = (concernId: string) => `/concerns/${encodeURIComponent(concernId)}`

/** 위로를 남길 수 있는 다른 사람의 숙성 중 고민(이미 위로한 고민은 빠진다, 무작위 최대 100개). `GET /api/v1/concerns` 의 `data`. */
export function fetchConcerns(): Promise<ConcernListResponse> {
  return api.get<ConcernListResponse>('/concerns')
}

/** 고민 상세(받은 위로는 포함하지 않는다). 내 고민이면 maturesAt 이 온다. 없으면 404. `GET /api/v1/concerns/{concernId}` 의 `data`. */
export function fetchConcernDetail(concernId: string): Promise<ConcernDetail> {
  return api.get<ConcernDetail>(path(concernId))
}

/**
 * 위로를 남긴다(201). 내용은 앞뒤 공백을 뺀 1~500자.
 * 오류: 409 REPLY_ALREADY_EXISTS·CONCERN_REPLY_CLOSED, 404 CONCERN_NOT_FOUND, 403 REPLY_OWN_CONCERN_FORBIDDEN, 400 COMMON_INVALID_REQUEST.
 * `POST /api/v1/concerns/{concernId}/replies`.
 */
export function createReply(concernId: string, body: CreateReplyRequest): Promise<CreateReplyResponse> {
  return api.post<CreateReplyResponse>(`${path(concernId)}/replies`, { content: body.content })
}

/**
 * 내가 쓴 고민(내 치즈) 목록, 최신순. `GET /api/v1/users/me/concerns?page&size` 의 `data`(size 1~100).
 * 임의 결정(확인 필요): 치즈 보관함 화면은 보관한 것만 주는 `/users/me/saved-concerns` 가 아니라 내가 쓴 고민 전체인 이 API 를 쓴다.
 */
export function fetchMyConcerns({ page = 0, size = 20 }: MyConcernListParams = {}): Promise<MyConcernListResponse> {
  return api.get<MyConcernListResponse>('/users/me/concerns', { query: { page, size } })
}

/**
 * 숙성이 끝난 내 고민을 개봉하고 받은 위로를 돌려준다(이미 열었으면 그대로 200). 받은 위로가 없으면 서버가 기본 위로 하나를 넣는다.
 * 숙성 중이면 409 CONCERN_NOT_MATURED, 내 고민이 아니면 404 CONCERN_NOT_FOUND. `POST /api/v1/concerns/{concernId}/open` (본문 없음).
 */
export function openConcern(concernId: string): Promise<OpenConcernResponse> {
  return api.post<OpenConcernResponse>(`${path(concernId)}/open`)
}

/** 개봉한 내 치즈의 위로를 다시 받는다. 개봉 전이면 409 CONCERN_NOT_OPENED, 내 고민이 아니면 404. `GET /api/v1/concerns/{concernId}/replies`. */
export function fetchConcernReplies(concernId: string): Promise<ConcernRepliesResponse> {
  return api.get<ConcernRepliesResponse>(`${path(concernId)}/replies`)
}
