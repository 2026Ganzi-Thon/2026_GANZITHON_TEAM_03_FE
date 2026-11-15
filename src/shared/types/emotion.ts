// 감정 기록 API 타입 - docs/api/emotion.md 기준
import type { DateString, Id, IsoDateTime, PageParams, Paged } from './common'

export interface Emotion {
  emotionId: Id
  /** 예: JOY, CALM. 실제 코드 목록은 기획 합의 필요 */
  code: string
  /** 표시 이름 (예: 기쁨) */
  name: string
  displayOrder: number
  /** 현재 선택 가능한 감정인지 */
  active: boolean
}

export interface EmotionRecord {
  recordId: Id
  recordDate: DateString
  /** 최대 1,000자 (제안) */
  memo: string | null
  /** 비활성 감정도 기존 연결이 있으면 포함 */
  emotions: Emotion[]
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

/** 감정 목록 조회 응답의 data */
export interface EmotionsResponse {
  items: Emotion[]
}

/** 감정 기록 작성. recordDate는 서버가 한국 날짜로 계산한다. */
export interface CreateEmotionRecordRequest {
  /** 서로 다른 활성 감정 ID 1개 이상 */
  emotionIds: Id[]
  /** 생략·null·공백뿐이면 null */
  memo?: string | null
}

/** 감정 기록 수정. 생략한 필드는 유지. emotionIds는 전체 교체(빈 배열 불가), memo null이면 삭제 */
export interface UpdateEmotionRecordRequest {
  emotionIds?: Id[]
  memo?: string | null
}

/** from/to를 둘 다 생략하면 이번 달 1일~오늘. 전달 시 둘 다 필요(최대 366일, 미래 불가) */
export interface EmotionRecordListParams extends PageParams {
  from?: DateString
  to?: DateString
}

/** 감정 기록 목록 응답의 data (size 기본 20, 상한 100) */
export type EmotionRecordListResponse = Paged<EmotionRecord>
