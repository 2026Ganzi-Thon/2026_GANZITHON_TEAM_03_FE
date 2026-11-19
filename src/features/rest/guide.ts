import type { GuideStep } from '@/shared/ui'

// 동굴 문 닫기 사용법 안내(오른쪽 위 `!`)
export const CAVE_GUIDE_STEPS: GuideStep[] = [
  { target: 'duration', title: '쉴 시간을 골라요', body: '5분, 10분, 15분 중에 골라요.' },
  { target: 'close', title: '문을 닫고 휴대폰을 눕혀요', body: '눕히면 화면이 어두워지고 시간이 흘러요.' },
  { target: 'scene', title: '다 쉬면 문이 열려요', body: '들면 언제든 열 수 있어요. 끝나면 기분을 한 줄로 남겨요.' },
]
