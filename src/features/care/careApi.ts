import { ApiError } from '@/shared/api'
import { mockDb, mockDelay } from '@/shared/mock'
import type { CareActionCategory, CategorizedCareAction } from './careActions'
import { CARE_ACTIONS } from './careActions'

// 돌봄 행동 분류·문구가 서버 명세에 추가되기 전까지 시안 기반 mock 목록을 사용한다.
export async function fetchCareActions(category: CareActionCategory): Promise<CategorizedCareAction[]> {
  await mockDelay()
  return CARE_ACTIONS.filter((action) => action.category === category)
}

export async function fetchTodayCareCompletions() {
  await mockDelay()
  return mockDb.care.listToday()
}

export async function completeCareAction(careActionId: string) {
  await mockDelay()
  const action = CARE_ACTIONS.find((item) => item.careActionId === careActionId)
  if (!action) throw new ApiError(404, { code: 'CARE_ACTION_NOT_FOUND', message: '돌봄 행동을 찾을 수 없어요.' })
  return mockDb.care.complete(action.careActionId, action.rewardAmount)
}
