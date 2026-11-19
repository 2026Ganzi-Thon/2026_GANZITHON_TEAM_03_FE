import type { GuideStep } from '@/shared/ui'
import type { CareAction } from './types'

// 양털 모으기 사용법 안내(오른쪽 위 `!`). 안내 중에는 실제 돌봄 목록 대신 아래 예시를 보여 화살표가 늘 같은 자리를 가리킨다
export const CARE_GUIDE_STEPS: GuideStep[] = [
  { target: 'recommend', title: '오늘의 추천', body: '오늘 해 보면 좋을 돌봄을 하나 골라 뒀어요.' },
  { target: 'categories', title: '분류와 할 일을 골라요', body: '움직이기, 마음돌봄, 쉬어가기, 일상가꾸기 중에 골라요.' },
  { target: 'start', title: '돌봄 시작', body: '시작하고 다 마치면 돌봄 완료를 눌러요. 그때 양털을 받아요.' },
]

const action = (id: number, name: string, category: string): CareAction => ({
  careActionId: `guide-${id}`,
  name,
  category,
  description: null,
  rewardAmount: 4,
  displayOrder: id,
})

export const CARE_GUIDE_ACTIONS: CareAction[] = [
  action(1, '물 한 잔 마시기', '움직이기'),
  action(2, '10분 산책하기', '움직이기'),
  action(5, '오늘의 마음을 한 줄로 적기', '마음돌봄'),
  action(6, '오늘 내가 애쓴 일 하나 알아주기', '마음돌봄'),
  action(7, '내 기분을 색이나 낙서로 표현하기', '마음돌봄'),
  action(8, '편한 사람에게 내 기분 이야기하기', '마음돌봄'),
  action(9, '좋아하는 음악 한 곡 듣기', '쉬어가기'),
  action(13, '침구 정리하기', '일상가꾸기'),
]

/** 안내 중 추천으로 보일 행동 */
export const CARE_GUIDE_RECOMMENDED_ID = 'guide-6'
