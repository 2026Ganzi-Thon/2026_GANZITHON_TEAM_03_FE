import { ApiError } from '@/shared/api'
import { mockDb, mockDelay } from '@/shared/mock'
import type { MockConcernRow } from '@/shared/mock'
import type { ConcernDetail, ConcernListResponse, CreateReplyRequest, CreateReplyResponse } from './types'

// TODO(API 연결): API 클라이언트(`@/shared/api`)가 준비됐으니 아래 세 함수의 본문만 호출로 바꾼다. `@/shared/mock` import·지연은 함께 지운다(고민·위로 여부는 가짜 DB 에 있다).
//   fetchConcerns:      return api.get<ConcernListResponse>('/concerns')
//   fetchConcernDetail: return api.get<ConcernDetail>(`/concerns/${concernId}`)
//   createReply:        return api.post<CreateReplyResponse>(`/concerns/${concernId}/replies`, body)
// (api 는 `@/shared/api`, 타입은 `@/shared/types`. 오류는 ApiError code 로 온다: REPLY_ALREADY_EXISTS 409,
//  CONCERN_REPLY_CLOSED 409, CONCERN_NOT_FOUND 404, REPLY_OWN_CONCERN_FORBIDDEN 403.)

export const REPLY_ALREADY_EXISTS = 'REPLY_ALREADY_EXISTS'
export const CONCERN_REPLY_CLOSED = 'CONCERN_REPLY_CLOSED'
export const CONCERN_NOT_FOUND = 'CONCERN_NOT_FOUND'
export const REPLY_OWN_CONCERN_FORBIDDEN = 'REPLY_OWN_CONCERN_FORBIDDEN'

// 임의 결정(확인 필요): mock 목록 preview 는 본문 앞 100자 — 실제 길이는 백엔드 미정(docs/api/cheese.md)
const PREVIEW_LENGTH = 100

function findConcern(concernId: string): MockConcernRow {
  const found = mockDb.cheese.get(concernId)
  if (!found) throw new ApiError(404, { code: CONCERN_NOT_FOUND, message: '고민이 없거나 삭제됐어요.' })
  return found
}

/** 위로를 남길 수 있는 고민 목록(이미 위로한 고민은 빠진다). `GET /api/v1/concerns` 의 `data`. */
export async function fetchConcerns(): Promise<ConcernListResponse> {
  await mockDelay()
  const items = mockDb.cheese
    .list()
    .filter((concern) => !concern.alreadyReplied)
    .map(({ concernId, content, comfortType, createdAt }) => ({
      concernId,
      preview: content.slice(0, PREVIEW_LENGTH),
      comfortType,
      createdAt,
    }))
  return { items, count: items.length }
}

/** 고민 상세(다른 사람의 위로는 포함하지 않는다). `GET /api/v1/concerns/{concernId}` 의 `data`. */
export async function fetchConcernDetail(concernId: string): Promise<ConcernDetail> {
  await mockDelay()
  const concern = findConcern(concernId)
  return {
    concernId: concern.concernId,
    content: concern.content,
    comfortType: concern.comfortType,
    createdAt: concern.createdAt,
    mine: false,
    status: 'MATURING',
    maturesAt: null,
    replyable: !concern.alreadyReplied,
    alreadyReplied: concern.alreadyReplied,
  }
}

/** 위로를 남긴다. 이미 남겼으면 409 를 흉내 낸 오류를 던진다. `POST /api/v1/concerns/{concernId}/replies`. */
export async function createReply(concernId: string, body: CreateReplyRequest): Promise<CreateReplyResponse> {
  await mockDelay()
  const concern = findConcern(concernId)
  if (concern.alreadyReplied) {
    throw new ApiError(409, { code: REPLY_ALREADY_EXISTS, message: '이미 위로를 남긴 고민이에요.' })
  }
  if (body.content.trim() === '') {
    throw new ApiError(400, { code: 'COMMON_INVALID_REQUEST', message: '내용을 입력해 주세요.' })
  }
  mockDb.cheese.markReplied(concernId)
  return { replyId: `r-${concernId}`, concernId, createdAt: new Date().toISOString() }
}
