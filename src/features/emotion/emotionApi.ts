import { ApiError } from '@/shared/api'
import { getTodaySeoul } from '@/shared/lib/formatRelativeDate'
import type {
  CreateEmotionRecordRequest,
  Emotion,
  EmotionRecord,
  EmotionRecordListResponse,
  EmotionsResponse,
} from './types'

// TODO(API 연결): API 클라이언트(`@/shared/api`)가 준비됐으니 아래 세 함수의 본문만 호출로 바꾼다. mock 상수·지연·메모리 배열은 함께 지운다.
//   fetchEmotions:        return (await api.get<EmotionsResponse>('/emotions')).items
//   fetchEmotionRecords:  return api.get<EmotionRecordListResponse>('/emotion-records?from=...&to=...&page=0&size=20')
//   createEmotionRecord:  return api.post<EmotionRecord>('/emotion-records', body)
// (api 는 `@/shared/api`, 타입은 `@/shared/types`. 409 는 ApiError code `EMOTION_RECORD_ALREADY_EXISTS` 로 온다.)

/** 오늘 이미 기록했을 때(409) `ApiError.code`. mock 도 같은 ApiError 를 던져서 API 연결 후에도 호출부가 그대로다. */
export const EMOTION_RECORD_ALREADY_EXISTS = 'EMOTION_RECORD_ALREADY_EXISTS'

// 임의 결정(확인 필요): 감정 7개와 code(JOY…CALM)를 임의로 만들었다 — Figma 칩 이름 그대로, 실제 목록은 기획 합의 필요
const MOCK_EMOTIONS: Emotion[] = [
  ['JOY', '기쁨'],
  ['SADNESS', '슬픔'],
  ['REGRET', '아쉬움'],
  ['FEAR', '두려움'],
  ['TIRED', '지침'],
  ['ANXIETY', '불안'],
  ['CALM', '평온'],
].map(([code, name], index) => ({
  emotionId: String(index + 1),
  code,
  name,
  displayOrder: index + 1,
  active: true,
}))

function daysAgo(days: number): string {
  const [year, month, day] = getTodaySeoul().split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10)
}

function emotionsOf(...ids: string[]): Emotion[] {
  return MOCK_EMOTIONS.filter((emotion) => ids.includes(emotion.emotionId))
}

function mockRecord(recordId: string, recordDate: string, memo: string | null, emotions: Emotion[]): EmotionRecord {
  const at = `${recordDate}T03:00:00Z`
  return { recordId, recordDate, memo, emotions, createdAt: at, updatedAt: at }
}

// 모듈 메모리에 작성 결과를 유지한다(새로고침하면 초기화). 최신 날짜가 앞에 오도록 둔다.
const mockRecords: EmotionRecord[] = [
  mockRecord('104', daysAgo(1), '산책하고 나니 조금 편안해졌다.', emotionsOf('7')),
  mockRecord('103', daysAgo(3), null, emotionsOf('5', '6')),
  mockRecord('102', daysAgo(7), '일이 많아서 정신없이 지나간 하루. 그래도 저녁에 먹은 국수가 맛있었다.', emotionsOf('5')),
  mockRecord('101', daysAgo(15), '오랜만에 친구를 만나서 많이 웃었다.', emotionsOf('1')),
]
let nextRecordId = 105

// 임의 결정(확인 필요): mock 응답에 0.3초 지연을 줘서 로딩 상태를 볼 수 있게 함 — API 연결 시 함께 지운다
const delay = () => new Promise((resolve) => setTimeout(resolve, 300))

/** 선택할 수 있는 활성 감정 목록(표시 순서). `GET /api/v1/emotions` 의 `data.items`. */
export async function fetchEmotions(): Promise<EmotionsResponse['items']> {
  await delay()
  return MOCK_EMOTIONS.filter((emotion) => emotion.active).sort((a, b) => a.displayOrder - b.displayOrder)
}

/** 최근 감정 기록(최신순). `GET /api/v1/emotion-records` 의 `data`. */
export async function fetchEmotionRecords(): Promise<EmotionRecordListResponse> {
  await delay()
  return { items: [...mockRecords], page: 0, size: 20, hasNext: false }
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
