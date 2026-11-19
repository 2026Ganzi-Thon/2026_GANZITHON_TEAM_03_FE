import { api } from '@/shared/api'
import type { HomeEmotionBrief, HomeSummaryResponse } from '@/shared/types'

/** 홈의 오늘의 감정 한 개(감정 기록 응답의 Emotion 에서 일부만) */
export type HomeEmotion = HomeEmotionBrief

/** `GET /api/v1/home` 응답 `data`. 백엔드 HomeService.Summary 와 같은 모양 */
export type HomeSummary = HomeSummaryResponse

/** 홈 요약 `GET /api/v1/home`. 닉네임·양털·오늘의 감정·숙성이 끝난(아직 안 연) 내 고민 수 */
export function fetchHomeSummary(): Promise<HomeSummary> {
  return api.get<HomeSummary>('/home')
}
