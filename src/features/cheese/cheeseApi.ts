import { api } from '@/shared/api'
import type {
  ConcernDetail,
  ConcernListResponse,
  CreateConcernRequest,
  CreateConcernResponse,
  CreateReplyRequest,
  CreateReplyResponse,
  ConcernRepliesResponse,
  MyConcernListParams,
  MyConcernListResponse,
  OpenConcernResponse,
  SaveConcernResponse,
  SavedConcernListParams,
  SavedConcernListResponse,
  UnsaveConcernResponse,
} from './types'

// 고민·위로(치즈) API. 응답·오류 코드는 백엔드 ConcernController·ConcernService·ComfortReplyService·CheeseService 기준.
// 목록(위로할 고민·내 고민·보관함)은 제목(title)과 본문 앞 100자(preview)를 준다 — 본문 전체는 상세(GET /concerns/{id})에서 받는다.

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
/** 받은 위로 조회·보관: 아직 개봉 전(409) */
export const CONCERN_NOT_OPENED = 'CONCERN_NOT_OPENED'
/** 형식 오류(400) — 고민 작성의 길이·위로 방식·키 형식 등 */
export const COMMON_INVALID_REQUEST = 'COMMON_INVALID_REQUEST'
/** 고민 작성: 같은 Idempotency-Key 로 다른 내용(409) */
export const COMMON_IDEMPOTENCY_CONFLICT = 'COMMON_IDEMPOTENCY_CONFLICT'
/** 고민 작성: 같은 사용자의 다른 요청이 행 잠금을 잡고 있음(409, 다시 시도하면 된다) */
export const COMMON_STATE_CONFLICT = 'COMMON_STATE_CONFLICT'

/** 고민 본문 최대 글자 수 — 백엔드 ConcernCreateRequest.CONTENT_LIMIT(앞뒤 공백을 뺀 코드 포인트 1000자) */
export const CONCERN_MAX_LENGTH = 1000
/** 고민 제목 최대 글자 수 — 백엔드 ConcernCreateRequest.TITLE_LIMIT(앞뒤 공백을 뺀 코드 포인트 50자, 한 줄) */
export const CONCERN_TITLE_MAX_LENGTH = 50

const path = (concernId: string) => `/concerns/${encodeURIComponent(concernId)}`

/** 위로를 남길 수 있는 다른 사람의 숙성 중 고민(이미 위로한 고민은 빠진다, 무작위 최대 100개). `GET /api/v1/concerns` 의 `data`. */
export function fetchConcerns(): Promise<ConcernListResponse> {
  return api.get<ConcernListResponse>('/concerns')
}

/**
 * 고민을 쓰고 숙성을 시작한다(201). 제목은 앞뒤 공백을 뺀 1~50자 한 줄(줄바꿈·탭 같은 제어 문자면 400), 내용은 앞뒤 공백을 뺀 1~1000자,
 * 위로 방식은 EMPATHY·EXPERIENCE·ADVICE, 다른 필드가 있으면 400.
 * `Idempotency-Key`(UUID) 필수 — 없거나 형식이 틀리면 400. 같은 키·같은 본문이면 처음 응답을 그대로 돌려주고, 같은 키·다른 본문이면 409.
 * 숙성 시간은 서버 설정(`app.activity.concern-maturing-hours`, 기본 24시간)이라 응답의 maturesAt 을 쓴다.
 * 오류: 400 COMMON_INVALID_REQUEST, 409 COMMON_IDEMPOTENCY_CONFLICT·COMMON_STATE_CONFLICT. `POST /api/v1/concerns`.
 */
export function createConcern(body: CreateConcernRequest, idempotencyKey: string): Promise<CreateConcernResponse> {
  return api.post<CreateConcernResponse>(
    '/concerns',
    { title: body.title, content: body.content, comfortType: body.comfortType },
    { idempotencyKey },
  )
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
 * 치즈 보관함 화면의 "내 고민" 탭(숙성 중·숙성 끝·개봉·보관 모두). "보관한 치즈" 탭은 `fetchSavedConcerns`.
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

/** 보관한 내 치즈, 보관 시각 최신순. `GET /api/v1/users/me/saved-concerns?page&size` 의 `data`(size 1~100). replyCount 는 기본 위로 포함. */
export function fetchSavedConcerns({ page = 0, size = 20 }: SavedConcernListParams = {}): Promise<SavedConcernListResponse> {
  return api.get<SavedConcernListResponse>('/users/me/saved-concerns', { query: { page, size } })
}

/**
 * 개봉한 내 치즈를 보관함에 넣는다(이미 보관했으면 savedAt 그대로 200). 본문 없음.
 * 개봉 전이면 409 CONCERN_NOT_OPENED, 없거나 내 고민이 아니면 404 CONCERN_NOT_FOUND. `PATCH /api/v1/concerns/{concernId}/save`.
 */
export function saveConcern(concernId: string): Promise<SaveConcernResponse> {
  return api.patch<SaveConcernResponse>(`${path(concernId)}/save`)
}

/**
 * 보관함에서 뺀다(고민·위로는 남는다, 이미 빠져 있어도 200). 응답 status 는 서버가 다시 계산한 값(보통 OPENED). 본문 없음.
 * 없거나 내 고민이 아니면 404 CONCERN_NOT_FOUND. `PATCH /api/v1/concerns/{concernId}/unsave`.
 */
export function unsaveConcern(concernId: string): Promise<UnsaveConcernResponse> {
  return api.patch<UnsaveConcernResponse>(`${path(concernId)}/unsave`)
}

/** 내 고민을 지운다(204, 받은 위로도 함께). 없거나 이미 지웠거나 내 고민이 아니면 404 CONCERN_NOT_FOUND. `DELETE /api/v1/concerns/{concernId}`. */
export function deleteConcern(concernId: string): Promise<void> {
  return api.delete<void>(path(concernId))
}
