// 감정 기록(emotion) 기능 타입. 근거: docs/api/emotion.md
import type { DateString, EmotionRecord } from '@/shared/types'

export type {
  CreateEmotionRecordRequest,
  Emotion,
  EmotionRecord,
  EmotionRecordListParams,
  EmotionRecordListResponse,
  EmotionsResponse,
  UpdateEmotionRecordRequest,
} from '@/shared/types'

/** 감정 기록 작성·수정 폼. 메모는 입력창 값이라 비어 있으면 빈 문자열(서버에는 null로 보낸다). */
export interface EmotionFormValues {
  /** 선택한 감정 ID. 1개 이상이어야 저장할 수 있다 */
  emotionIds: string[]
  /** 최대 1,000자 (제안) */
  memo: string
}

/** 캘린더에서 보는 달 */
export interface EmotionMonth {
  year: number
  /** 1~12 */
  month: number
}

/** 날짜별 기록. 하루 한 기록이 제안이라 날짜를 키로 둔다(확정되면 바뀔 수 있다). */
export type EmotionRecordsByDate = Record<DateString, EmotionRecord>

export type EmotionRecordsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; records: EmotionRecord[]; hasNext: boolean }
