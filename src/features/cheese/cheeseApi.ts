import { ApiError } from '@/shared/api'
import type { ComfortType, ConcernDetail, ConcernListResponse, CreateReplyRequest, CreateReplyResponse } from './types'

// TODO(API 연결): API 클라이언트(`@/shared/api`)가 준비됐으니 아래 세 함수의 본문만 호출로 바꾼다. mock 상수·지연·메모리 배열은 함께 지운다.
//   fetchConcerns:      return api.get<ConcernListResponse>('/concerns')
//   fetchConcernDetail: return api.get<ConcernDetail>(`/concerns/${concernId}`)
//   createReply:        return api.post<CreateReplyResponse>(`/concerns/${concernId}/replies`, body)
// (api 는 `@/shared/api`, 타입은 `@/shared/types`. 오류는 ApiError code 로 온다: REPLY_ALREADY_EXISTS 409,
//  CONCERN_REPLY_CLOSED 409, CONCERN_NOT_FOUND 404, REPLY_OWN_CONCERN_FORBIDDEN 403.)

export const REPLY_ALREADY_EXISTS = 'REPLY_ALREADY_EXISTS'
export const CONCERN_REPLY_CLOSED = 'CONCERN_REPLY_CLOSED'
export const CONCERN_NOT_FOUND = 'CONCERN_NOT_FOUND'
export const REPLY_OWN_CONCERN_FORBIDDEN = 'REPLY_OWN_CONCERN_FORBIDDEN'

interface MockConcern {
  concernId: string
  content: string
  comfortType: ComfortType
  createdAt: string
  alreadyReplied: boolean
}

function mock(concernId: string, createdAt: string, comfortType: ComfortType, content: string): MockConcern {
  return { concernId, content, comfortType, createdAt, alreadyReplied: false }
}

// 모듈 메모리(새로고침하면 초기화). 본문 첫 줄이 제목 자리에 보인다.
const mockConcerns: MockConcern[] = [
  mock('201', '2026-11-12T01:00:00Z', 'EMPATHY', '취업 준비가 길어지니 자꾸 비교하게 돼요\n친구들은 하나둘 자리를 잡는데 저만 제자리인 것 같아요.\n응원해 주는 가족에게도 미안해서 요즘은 말수가 줄었어요.\n오늘도 이력서를 열었다가 한참 보고만 있었어요.'),
  mock('202', '2026-11-11T09:30:00Z', 'ADVICE', '팀 사람들과 어떻게 가까워질 수 있을까요\n이직한 지 석 달인데 점심시간이 아직도 어색해요.\n먼저 말을 걸고 싶은데 타이밍을 놓치곤 해요.'),
  mock('203', '2026-11-10T12:00:00Z', 'EXPERIENCE', '혼자 사는 게 문득 외로운 밤이 있어요\n퇴근하고 불을 켜면 너무 조용해서 괜히 티비를 틀어 놓아요.\n다들 이런 시기를 어떻게 지나왔는지 궁금해요.'),
  mock('204', '2026-11-10T03:20:00Z', 'EMPATHY', '아무것도 하기 싫은 주말이었어요\n해야 할 일은 쌓여 있는데 침대에서 하루가 다 갔어요. 그런 제가 한심하게 느껴져요.'),
  mock('205', '2026-11-09T15:10:00Z', 'ADVICE', '운동을 시작하고 싶은데 작심삼일이에요\n매번 의욕만 앞서고 일주일을 못 가요.\n작게 시작하는 방법이 있을까요?'),
  mock('206', '2026-11-09T05:45:00Z', 'EXPERIENCE', '오랜 친구와 멀어진 것 같아요\n연락이 뜸해지다 보니 이제는 먼저 말 걸기가 어려워졌어요. 이런 경험 있으세요?'),
  mock('207', '2026-11-08T11:00:00Z', 'EMPATHY', '시험 결과가 나오기 전날이에요\n잠이 안 오고 자꾸 최악의 결과만 떠올라요. 그냥 누군가 괜찮다고 말해줬으면 좋겠어요.'),
  mock('208', '2026-11-07T08:30:00Z', 'ADVICE', '하고 싶은 일과 해야 하는 일 사이에서 고민이에요\n안정적인 길을 가자니 마음이 무겁고, 하고 싶은 걸 하자니 불안해요.\n어떤 기준으로 정하면 좋을까요?'),
  mock('209', '2026-11-06T14:00:00Z', 'EXPERIENCE', '부모님께 속마음을 말하기가 어려워요\n걱정하실까 봐 늘 괜찮다고만 해요.'),
  mock('210', '2026-11-05T02:00:00Z', 'EMPATHY', '요즘 자주 눈물이 나요\n이유를 딱 집어 말할 수는 없는데 사소한 일에도 울컥해요.\n그냥 잠깐 쉬어도 되는 걸까요.'),
]

// 임의 결정(확인 필요): mock 응답에 0.3초 지연을 줘서 로딩 상태를 볼 수 있게 함 — API 연결 시 함께 지운다
const delay = () => new Promise((resolve) => setTimeout(resolve, 300))

// 임의 결정(확인 필요): mock 목록 preview 는 본문 앞 100자 — 실제 길이는 백엔드 미정(docs/api/cheese.md)
const PREVIEW_LENGTH = 100

function findConcern(concernId: string): MockConcern {
  const found = mockConcerns.find((concern) => concern.concernId === concernId)
  if (!found) throw new ApiError(404, { code: CONCERN_NOT_FOUND, message: '고민이 없거나 삭제됐어요.' })
  return found
}

/** 위로를 남길 수 있는 고민 목록(이미 위로한 고민은 빠진다). `GET /api/v1/concerns` 의 `data`. */
export async function fetchConcerns(): Promise<ConcernListResponse> {
  await delay()
  const items = mockConcerns
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
  await delay()
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
  await delay()
  const concern = findConcern(concernId)
  if (concern.alreadyReplied) {
    throw new ApiError(409, { code: REPLY_ALREADY_EXISTS, message: '이미 위로를 남긴 고민이에요.' })
  }
  if (body.content.trim() === '') {
    throw new ApiError(400, { code: 'COMMON_INVALID_REQUEST', message: '내용을 입력해 주세요.' })
  }
  concern.alreadyReplied = true
  return { replyId: `r-${concernId}`, concernId, createdAt: new Date().toISOString() }
}
