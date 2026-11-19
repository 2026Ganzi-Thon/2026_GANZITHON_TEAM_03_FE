// 메인 홈 API 타입 - docs/api/home.md 기준
import type { DateString, Id } from './common'

/** 홈의 오늘의 감정 요약에 쓰는 감정 표현 (감정 기록 응답의 Emotion에서 일부만) */
export interface HomeEmotionBrief {
  emotionId: Id
  code: string
  name: string
}

export interface HomeTodayEmotion {
  recorded: boolean
  /** 기록이 없으면 null */
  recordId: Id | null
  /** 기록이 없으면 빈 배열 */
  emotions: HomeEmotionBrief[]
}

/** 홈 요약 조회 응답의 data */
export interface HomeSummaryResponse {
  /** 초기 설정 전이면 null */
  nickname: string | null
  /** 현재 사용 가능한 양털, 0 이상 (지갑이 없으면 0) */
  woolBalance: number
  today: DateString
  todayEmotion: HomeTodayEmotion
  /** 숙성이 끝났지만 아직 개봉하지 않은 내 고민 수 (백엔드 HomeService에서 계산) */
  maturedConcernCount: number
}
