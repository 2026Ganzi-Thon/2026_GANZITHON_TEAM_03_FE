import { api, hasErrorCode } from '@/shared/api'
import { getTodaySeoul } from '@/shared/lib/formatRelativeDate'
import type {
  CreateEmotionRecordRequest,
  EmotionRecord,
  EmotionRecordListResponse,
  EmotionsResponse,
} from './types'

// 감정 기록 API. 오류 코드·쿼리는 백엔드 EmotionController·EmotionService 기준(docs/api/emotion.md 초안과 다를 수 있다).

/** 오늘 이미 기록했을 때(409) `ApiError.code` */
export const EMOTION_RECORD_ALREADY_EXISTS = 'EMOTION_RECORD_ALREADY_EXISTS'

/** 없거나 내 기록이 아닐 때(404) `ApiError.code`. 이미 삭제한 ID 도 같다. */
export const EMOTION_RECORD_NOT_FOUND = 'EMOTION_RECORD_NOT_FOUND'

/** 감정 ID 가 비었거나 중복·없는·비활성 감정일 때(400) */
export const EMOTION_INVALID_SELECTION = 'EMOTION_INVALID_SELECTION'

/** from·to 가 형식에 안 맞거나 미래·366일 이상일 때(400) */
export const EMOTION_INVALID_DATE_RANGE = 'EMOTION_INVALID_DATE_RANGE'

/** 최근 기록 목록에서 보는 기간(일). 서버 상한은 from~to 사이 365일 */
const RECENT_RANGE_DAYS = 365
/** 최근 기록 한 번에 받는 개수(서버 기본 20, 상한 100) */
const RECENT_PAGE_SIZE = 20

function daysBefore(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10)
}

/** 선택할 수 있는 활성 감정 목록(표시 순서). `GET /api/v1/emotions` 의 `data.items`. */
export async function fetchEmotions(): Promise<EmotionsResponse['items']> {
  return (await api.get<EmotionsResponse>('/emotions')).items
}

/**
 * 최근 감정 기록(최신순) 첫 페이지. `GET /api/v1/emotion-records?from&to&page&size` 의 `data`.
 * 서버는 from·to 를 생략하면 "이번 달 1일~오늘"만 주므로 지난 1년을 명시한다.
 * 기기 시계가 서버보다 앞서 to 가 서버의 "오늘"보다 미래가 되면 400 EMOTION_INVALID_DATE_RANGE 가 오므로, 그때는 기간 없이 한 번 더 부른다.
 */
export async function fetchEmotionRecords(): Promise<EmotionRecordListResponse> {
  const to = getTodaySeoul()
  const from = daysBefore(to, RECENT_RANGE_DAYS)
  try {
    return await api.get<EmotionRecordListResponse>('/emotion-records', {
      query: { from, to, page: 0, size: RECENT_PAGE_SIZE },
    })
  } catch (error) {
    if (!hasErrorCode(error, EMOTION_INVALID_DATE_RANGE)) throw error
    return api.get<EmotionRecordListResponse>('/emotion-records', { query: { page: 0, size: RECENT_PAGE_SIZE } })
  }
}

/** 감정 기록 한 건. 없으면 404 EMOTION_RECORD_NOT_FOUND. `GET /api/v1/emotion-records/{recordId}`. */
export function fetchEmotionRecord(recordId: string): Promise<EmotionRecord> {
  return api.get<EmotionRecord>(`/emotion-records/${encodeURIComponent(recordId)}`)
}

/** 감정 기록 한 건을 지운다. 없으면 404 EMOTION_RECORD_NOT_FOUND. `DELETE /api/v1/emotion-records/{recordId}` (204). */
export async function deleteEmotionRecord(recordId: string): Promise<void> {
  await api.delete(`/emotion-records/${encodeURIComponent(recordId)}`)
}

/**
 * 오늘(서울)의 감정 기록을 만든다(201). 오늘 기록이 이미 있으면 409 EMOTION_RECORD_ALREADY_EXISTS,
 * 감정 선택이 잘못되면 400 EMOTION_INVALID_SELECTION. `POST /api/v1/emotion-records`.
 * 서버는 모르는 필드를 400 으로 거절하므로 emotionIds·memo 만 보낸다.
 */
export function createEmotionRecord({ emotionIds, memo }: CreateEmotionRecordRequest): Promise<EmotionRecord> {
  return api.post<EmotionRecord>('/emotion-records', { emotionIds: [...new Set(emotionIds)], memo: memo ?? null })
}
