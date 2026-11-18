import { ApiError } from '@/shared/api'
import { mockDb, mockDelay } from '@/shared/mock'
import type { MockConcernRow, MockMyConcernRow } from '@/shared/mock'
import type {
  ConcernDetail,
  ConcernListResponse,
  ConcernStatus,
  CreateReplyRequest,
  CreateReplyResponse,
  ConcernRepliesResponse,
  MyConcernListParams,
  MyConcernListResponse,
  OpenConcernResponse,
} from './types'

// TODO(API 연결): API 클라이언트(`@/shared/api`)가 준비됐으니 아래 세 함수의 본문만 호출로 바꾼다(내 고민 목록·개봉·받은 위로는 각 함수 위 주석). `@/shared/mock` import·지연은 함께 지운다(고민·위로 여부는 가짜 DB 에 있다).
//   fetchConcerns:      return api.get<ConcernListResponse>('/concerns')
//   fetchConcernDetail: return api.get<ConcernDetail>(`/concerns/${concernId}`)
//   createReply:        return api.post<CreateReplyResponse>(`/concerns/${concernId}/replies`, body)
// (api 는 `@/shared/api`, 타입은 `@/shared/types`. 오류는 ApiError code 로 온다: REPLY_ALREADY_EXISTS 409,
//  CONCERN_REPLY_CLOSED 409, CONCERN_NOT_FOUND 404, REPLY_OWN_CONCERN_FORBIDDEN 403.)

export const REPLY_ALREADY_EXISTS = 'REPLY_ALREADY_EXISTS'
export const CONCERN_REPLY_CLOSED = 'CONCERN_REPLY_CLOSED'
export const CONCERN_NOT_FOUND = 'CONCERN_NOT_FOUND'
export const REPLY_OWN_CONCERN_FORBIDDEN = 'REPLY_OWN_CONCERN_FORBIDDEN'
export const CONCERN_NOT_MATURED = 'CONCERN_NOT_MATURED'
export const CONCERN_NOT_OPENED = 'CONCERN_NOT_OPENED'

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

/** 고민 상세(다른 사람의 위로는 포함하지 않는다). `GET /api/v1/concerns/{concernId}` 의 `data`. 내 고민이면 상태·숙성 종료 시각이 온다. */
export async function fetchConcernDetail(concernId: string): Promise<ConcernDetail> {
  await mockDelay()
  const mine = mockDb.cheese.getMine(concernId)
  if (mine) {
    return {
      concernId: mine.concernId,
      content: mine.content,
      comfortType: mine.comfortType,
      createdAt: mine.createdAt,
      mine: true,
      status: toConcernStatus(mine, Date.now()),
      maturesAt: mine.maturesAt,
      replyable: false,
      alreadyReplied: false,
    }
  }
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

/** 서버가 시각으로 계산하는 상태(docs/api/cheese.md "개념"): 보관 > 개봉 > 숙성 끝 > 숙성 중 */
function toConcernStatus(row: MockMyConcernRow, now: number): ConcernStatus {
  if (row.savedAt) return 'SAVED'
  if (row.openedAt) return 'OPENED'
  return Date.parse(row.maturesAt) <= now ? 'MATURED' : 'MATURING'
}

// TODO(API 연결): 본문을 `return api.get<MyConcernListResponse>('/users/me/concerns', { query: { page, size } })` 로 바꾼다.
/**
 * 내가 쓴 고민(내 치즈) 목록, 최신순. `GET /api/v1/users/me/concerns?page&size` 의 `data`.
 * 임의 결정(확인 필요): 치즈 보관함 화면은 보관한 것만 주는 `/users/me/saved-concerns` 가 아니라 내가 쓴 고민 전체인 이 API 를 쓴다.
 * 명세 5번의 미결정("보관한 치즈도 이 목록에 보여줄지")은 보여주는 쪽으로 흉내 낸다.
 */
export async function fetchMyConcerns({ page = 0, size = 20 }: MyConcernListParams = {}): Promise<MyConcernListResponse> {
  await mockDelay()
  if (page < 0 || size < 1 || size > 50) {
    throw new ApiError(400, { code: 'COMMON_INVALID_REQUEST', message: 'page·size 범위를 확인해 주세요.' })
  }
  const now = Date.now()
  const rows = mockDb.cheese.listMine().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const items = rows.slice(page * size, (page + 1) * size).map((row) => ({
    concernId: row.concernId,
    // 본문 전체는 상세(GET /concerns/{id})에서 받는다 — 위로할 목록과 같은 길이로 자른다
    preview: row.content.slice(0, PREVIEW_LENGTH),
    comfortType: row.comfortType,
    status: toConcernStatus(row, now),
    maturesAt: row.maturesAt,
    openedAt: row.openedAt,
    createdAt: row.createdAt,
  }))
  return { items, page, size, hasNext: (page + 1) * size < rows.length }
}

function findMyConcern(concernId: string): MockMyConcernRow {
  const found = mockDb.cheese.getMine(concernId)
  if (!found) throw new ApiError(404, { code: CONCERN_NOT_FOUND, message: '고민이 없거나 내 고민이 아니에요.' })
  return found
}

function toRepliesResponse(row: MockMyConcernRow): ConcernRepliesResponse {
  return {
    concernId: row.concernId,
    status: row.savedAt ? 'SAVED' : 'OPENED',
    openedAt: row.openedAt ?? new Date().toISOString(),
    replies: [...row.replies].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  }
}

// 임의 결정(확인 필요): 위로가 없을 때 넣는 기본 위로 문구 — 명세 미결정(docs/api/cheese.md 6번)
const FALLBACK_REPLY = '여기까지 마음을 꺼내 놓은 것만으로도 충분히 잘했어요. 오늘은 조금 쉬어 가도 괜찮아요.'

// TODO(API 연결): 본문을 `return api.post<OpenConcernResponse>(`/concerns/${concernId}/open`)` 로 바꾼다.
/**
 * 숙성이 끝난 내 고민을 개봉하고 받은 위로를 돌려준다(이미 열었으면 그대로 200). 위로가 없으면 기본 위로 하나를 넣는다.
 * 숙성 중이면 409 `CONCERN_NOT_MATURED`, 내 고민이 아니면 404. `POST /api/v1/concerns/{concernId}/open`.
 */
export async function openConcern(concernId: string): Promise<OpenConcernResponse> {
  await mockDelay()
  const row = findMyConcern(concernId)
  if (!row.openedAt && Date.parse(row.maturesAt) > Date.now()) {
    throw new ApiError(409, { code: CONCERN_NOT_MATURED, message: '아직 숙성 중이에요.' })
  }
  const opened = mockDb.cheese.openMine(concernId, { content: FALLBACK_REPLY, fromSystem: true }) ?? row
  return toRepliesResponse(opened)
}

// TODO(API 연결): 본문을 `return api.get<ConcernRepliesResponse>(`/concerns/${concernId}/replies`)` 로 바꾼다.
/** 개봉한 내 치즈의 위로를 다시 받는다. 개봉 전이면 409 `CONCERN_NOT_OPENED`. `GET /api/v1/concerns/{concernId}/replies`. */
export async function fetchConcernReplies(concernId: string): Promise<ConcernRepliesResponse> {
  await mockDelay()
  const row = findMyConcern(concernId)
  if (!row.openedAt) throw new ApiError(409, { code: CONCERN_NOT_OPENED, message: '아직 개봉하지 않았어요.' })
  return toRepliesResponse(row)
}
