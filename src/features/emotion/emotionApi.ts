import { ApiError } from '@/shared/api'
import { getTodaySeoul } from '@/shared/lib/formatRelativeDate'
import { EMOTIONS } from './emotions'
import type {
  CreateEmotionRecordRequest,
  Emotion,
  EmotionRecord,
  EmotionRecordListResponse,
  EmotionsResponse,
} from './types'

// TODO(API 연결): API 클라이언트(`@/shared/api`)가 준비됐으니 아래 함수들의 본문만 호출로 바꾼다. mock 상수·지연·메모리 배열은 함께 지운다.
//   fetchEmotions:        return (await api.get<EmotionsResponse>('/emotions')).items
//   fetchEmotionRecords:  return api.get<EmotionRecordListResponse>('/emotion-records?from=...&to=...&page=0&size=20')
//   fetchEmotionRecord:   return api.get<EmotionRecord>(`/emotion-records/${recordId}`)
//   createEmotionRecord:  return api.post<EmotionRecord>('/emotion-records', body)
//   deleteEmotionRecord:  await api.delete(`/emotion-records/${recordId}`)   // 204, 본문 없음
// mock 감정 목록의 출처는 emotions.ts 상수 — 서버 감정 ID·code와 맞춰야 한다.
// (api 는 `@/shared/api`, 타입은 `@/shared/types`. 409 는 ApiError code `EMOTION_RECORD_ALREADY_EXISTS`, 404 는 `EMOTION_RECORD_NOT_FOUND` 로 온다.)

/** 오늘 이미 기록했을 때(409) `ApiError.code`. mock 도 같은 ApiError 를 던져서 API 연결 후에도 호출부가 그대로다. */
export const EMOTION_RECORD_ALREADY_EXISTS = 'EMOTION_RECORD_ALREADY_EXISTS'

/** 없거나 내 기록이 아닐 때(404) `ApiError.code`. 이미 삭제한 ID 도 같다. */
export const EMOTION_RECORD_NOT_FOUND = 'EMOTION_RECORD_NOT_FOUND'

function notFound(): ApiError {
  return new ApiError(404, { code: EMOTION_RECORD_NOT_FOUND, message: '감정 기록을 찾을 수 없어요.' })
}

function daysAgo(days: number): string {
  const [year, month, day] = getTodaySeoul().split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10)
}

function emotionsOf(...ids: string[]): Emotion[] {
  return EMOTIONS.filter((emotion) => ids.includes(emotion.emotionId))
}

function mockRecord(
  recordId: string,
  recordDate: string,
  memo: string | null,
  emotions: Emotion[],
  { edited = false } = {},
): EmotionRecord {
  const at = `${recordDate}T03:00:00Z`
  // 상세 화면의 "수정됨" 표시를 볼 수 있게 일부 mock 은 updatedAt 을 몇 시간 뒤로 둔다
  const updatedAt = edited ? `${recordDate}T09:00:00Z` : at
  return { recordId, recordDate, memo, emotions, createdAt: at, updatedAt }
}

// 모듈 메모리에 작성 결과를 유지한다(새로고침하면 초기화). 최신 날짜가 앞에 오도록 둔다.
const mockRecords: EmotionRecord[] = [
  mockRecord('104', daysAgo(1), '산책하고 나니 조금 편안해졌다.', emotionsOf('7')),
  mockRecord('103', daysAgo(3), null, emotionsOf('5', '6')),
  mockRecord('102', daysAgo(7), '일이 많아서 정신없이 지나간 하루.\n그래도 저녁에 먹은 국수가 맛있었다.', emotionsOf('5'), { edited: true }),
  mockRecord('101', daysAgo(15), '오랜만에 친구를 만나서 많이 웃었다.', emotionsOf('1')),
]
let nextRecordId = 105

// 임의 결정(확인 필요): mock 응답에 0.3초 지연을 줘서 로딩 상태를 볼 수 있게 함 — API 연결 시 함께 지운다
const delay = () => new Promise((resolve) => setTimeout(resolve, 300))

/** 선택할 수 있는 활성 감정 목록(표시 순서). `GET /api/v1/emotions` 의 `data.items`. */
export async function fetchEmotions(): Promise<EmotionsResponse['items']> {
  await delay()
  return EMOTIONS.filter((emotion) => emotion.active).sort((a, b) => a.displayOrder - b.displayOrder)
}

/** 최근 감정 기록(최신순). `GET /api/v1/emotion-records` 의 `data`. */
export async function fetchEmotionRecords(): Promise<EmotionRecordListResponse> {
  await delay()
  return { items: [...mockRecords], page: 0, size: 20, hasNext: false }
}

/** 감정 기록 한 건. 없으면 404 를 흉내 낸 오류를 던진다. `GET /api/v1/emotion-records/{recordId}`. */
export async function fetchEmotionRecord(recordId: string): Promise<EmotionRecord> {
  await delay()
  const record = mockRecords.find((item) => item.recordId === recordId)
  if (!record) throw notFound()
  return record
}

/** 감정 기록 한 건을 지운다. 없으면 404 를 흉내 낸 오류를 던진다. `DELETE /api/v1/emotion-records/{recordId}` (204). */
export async function deleteEmotionRecord(recordId: string): Promise<void> {
  await delay()
  const index = mockRecords.findIndex((item) => item.recordId === recordId)
  if (index === -1) throw notFound()
  mockRecords.splice(index, 1)
}

/** 오늘의 감정 기록을 만든다. 오늘 기록이 이미 있으면 409 를 흉내 낸 오류를 던진다. `POST /api/v1/emotion-records`. */
export async function createEmotionRecord(body: CreateEmotionRecordRequest): Promise<EmotionRecord> {
  await delay()

  const today = getTodaySeoul()
  if (mockRecords.some((record) => record.recordDate === today)) {
    throw new ApiError(409, { code: EMOTION_RECORD_ALREADY_EXISTS, message: '오늘의 기록이 이미 있어요.' })
  }

  const memo = body.memo?.trim() ? body.memo.trim() : null
  const record = mockRecord(String(nextRecordId++), today, memo, emotionsOf(...body.emotionIds))
  mockRecords.unshift(record)
  return record
}
