import type { CareAction } from '@/shared/types'

export type CareActionCategory = 'move' | 'mind' | 'rest' | 'daily'

export interface CategorizedCareAction extends CareAction {
  category: CareActionCategory
}

export const CARE_CATEGORIES: { id: CareActionCategory; label: string }[] = [
  { id: 'move', label: '움직이기' },
  { id: 'mind', label: '마음돌봄' },
  { id: 'rest', label: '쉬어가기' },
  { id: 'daily', label: '일상가꾸기' },
]

/** 서버 목록에 분류가 포함될 때 API 데이터로 옮긴다. 보상량 4는 시안의 예시 값이다. */
export const CARE_ACTIONS: CategorizedCareAction[] = [
  { careActionId: '1', category: 'move', name: '물 한 잔 마시기', description: null, rewardAmount: 4, displayOrder: 1 },
  { careActionId: '2', category: 'move', name: '간단한 간식 먹기', description: null, rewardAmount: 4, displayOrder: 2 },
  { careActionId: '3', category: 'move', name: '10분 산책하기', description: null, rewardAmount: 4, displayOrder: 3 },
  { careActionId: '4', category: 'move', name: '편안한 옷으로 갈아입기', description: null, rewardAmount: 4, displayOrder: 4 },
  { careActionId: '5', category: 'mind', name: '양 먹이주기: 오늘의 마음을 한 줄로 적기', description: null, rewardAmount: 4, displayOrder: 1 },
  { careActionId: '6', category: 'mind', name: '오늘 내가 애쓴 일 하나 알아주기', description: null, rewardAmount: 4, displayOrder: 2 },
  { careActionId: '7', category: 'mind', name: '내 기분을 색이나 낙서로 표현하기', description: null, rewardAmount: 4, displayOrder: 3 },
  { careActionId: '8', category: 'mind', name: '편한 사람에게 내 기분 이야기하기', description: null, rewardAmount: 4, displayOrder: 4 },
  { careActionId: '9', category: 'rest', name: '동굴 5분 닫기: 휴대폰을 5분 뒤집어보세요', description: null, rewardAmount: 4, displayOrder: 1 },
  { careActionId: '10', category: 'rest', name: '불필요한 알림 잠시 끄기', description: null, rewardAmount: 4, displayOrder: 2 },
  { careActionId: '11', category: 'rest', name: '좋아하는 음악 한 곡 듣기', description: null, rewardAmount: 4, displayOrder: 3 },
  { careActionId: '12', category: 'rest', name: '따뜻한 음료 천천히 마시기', description: null, rewardAmount: 4, displayOrder: 4 },
  { careActionId: '13', category: 'daily', name: '침구 정리하기', description: null, rewardAmount: 4, displayOrder: 1 },
  { careActionId: '14', category: 'daily', name: '책상 위 물건 정리하기', description: null, rewardAmount: 4, displayOrder: 2 },
  { careActionId: '15', category: 'daily', name: '사용한 컵 하나 씻기', description: null, rewardAmount: 4, displayOrder: 3 },
  { careActionId: '16', category: 'daily', name: '마음에 드는 순간 사진으로 남기기', description: null, rewardAmount: 4, displayOrder: 4 },
]
