import { ApiError } from '@/shared/api'
import { mockDb, mockDelay, mockToday } from '@/shared/mock'
import type {
  CreateEmotionRecordRequest,
  EmotionRecord,
  EmotionRecordListResponse,
  EmotionsResponse,
} from './types'

// TODO(API 연결): API 클라이언트(`@/shared/api`)가 준비됐으니 아래 함수들의 본문만 호출로 바꾼다. `@/shared/mock` import·지연은 함께 지운다.
//   fetchEmotions:        return (await api.get<EmotionsResponse>('/emotions')).items
//   fetchEmotionRecords:  return api.get<EmotionRecordListResponse>('/emotion-records?from=...&to=...&page=0&size=20')
//   fetchEmotionRecord:   return api.get<EmotionRecord>(`/emotion-records/${recordId}`)
//   createEmotionRecord:  return api.post<EmotionRecord>('/emotion-records', body)
//   deleteEmotionRecord:  await api.delete(`/emotion-records/${recordId}`)   // 204, 본문 없음
// mock 감정 목록·기록은 가짜 DB(`@/shared/mock`)에 있다 — 서버 감정 ID·code와 맞춰야 한다.
// (api 는 `@/shared/api`, 타입은 `@/shared/types`. 409 는 ApiError code `EMOTION_RECORD_ALREADY_EXISTS`, 404 는 `EMOTION_RECORD_NOT_FOUND` 로 온다.)

/** 오늘 이미 기록했을 때(409) `ApiError.code`. mock 도 같은 ApiError 를 던져서 API 연결 후에도 호출부가 그대로다. */
export const EMOTION_RECORD_ALREADY_EXISTS = 'EMOTION_RECORD_ALREADY_EXISTS'

/** 없거나 내 기록이 아닐 때(404) `ApiError.code`. 이미 삭제한 ID 도 같다. */
export const EMOTION_RECORD_NOT_FOUND = 'EMOTION_RECORD_NOT_FOUND'

function notFound(): ApiError {
  return new ApiError(404, { code: EMOTION_RECORD_NOT_FOUND, message: '감정 기록을 찾을 수 없어요.' })
}

/** 선택할 수 있는 활성 감정 목록(표시 순서). `GET /api/v1/emotions` 의 `data.items`. */
export async function fetchEmotions(): Promise<EmotionsResponse['items']> {
  await mockDelay()
  return mockDb.emotion.catalog().filter((emotion) => emotion.active).sort((a, b) => a.displayOrder - b.displayOrder)
}

/** 최근 감정 기록(최신순). `GET /api/v1/emotion-records` 의 `data`. */
export async function fetchEmotionRecords(): Promise<EmotionRecordListResponse> {
  await mockDelay()
  return { items: mockDb.emotion.list(), page: 0, size: 20, hasNext: false }
}

/** 감정 기록 한 건. 없으면 404 를 흉내 낸 오류를 던진다. `GET /api/v1/emotion-records/{recordId}`. */
export async function fetchEmotionRecord(recordId: string): Promise<EmotionRecord> {
  await mockDelay()
  const record = mockDb.emotion.get(recordId)
  if (!record) throw notFound()
  return record
}

/** 감정 기록 한 건을 지운다. 없으면 404 를 흉내 낸 오류를 던진다. `DELETE /api/v1/emotion-records/{recordId}` (204). */
export async function deleteEmotionRecord(recordId: string): Promise<void> {
  await mockDelay()
  if (!mockDb.emotion.remove(recordId)) throw notFound()
}

/** 오늘의 감정 기록을 만든다. 오늘 기록이 이미 있으면 409 를 흉내 낸 오류를 던진다. `POST /api/v1/emotion-records`. */
export async function createEmotionRecord(body: CreateEmotionRecordRequest): Promise<EmotionRecord> {
  await mockDelay()

  const today = mockToday()
  if (mockDb.emotion.findByDate(today)) {
    throw new ApiError(409, { code: EMOTION_RECORD_ALREADY_EXISTS, message: '오늘의 기록이 이미 있어요.' })
  }

  const memo = body.memo?.trim() ? body.memo.trim() : null
  return mockDb.emotion.create({ recordDate: today, memo, emotionIds: [...new Set(body.emotionIds)] })
}
