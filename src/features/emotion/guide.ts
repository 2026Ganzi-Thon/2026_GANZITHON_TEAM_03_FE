import type { GuideStep } from '@/shared/ui'
import type { EmotionRecordRow } from './EmotionRecordList'

// 양 먹이주기 사용법 안내(오른쪽 위 `!`). 안내 중에는 실제 기록 대신 아래 예시를 보여 화살표가 늘 같은 자리를 가리킨다
export const EMOTION_GUIDE_STEPS: GuideStep[] = [
  { target: 'feed', title: '먹이주기를 눌러요', body: '오늘의 감정을 고르면 양에게 먹이가 돼요. 하루에 한 번 줄 수 있어요.' },
  { target: 'records', title: '지난 기록을 다시 봐요', body: '기록을 누르면 그날의 감정과 지푸라기를 볼 수 있어요.' },
]

function daysBefore(today: string, days: number): string {
  const [y, m, d] = today.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d - days))
  return date.toISOString().slice(0, 10)
}

/** 안내 중에 보일 지난 기록 예시 3줄(어제·2일 전·4일 전) */
export function emotionGuideRows(today: string): EmotionRecordRow[] {
  return [
    { id: 'guide-1', text: '기쁨, 평온', date: daysBefore(today, 1) },
    { id: 'guide-2', text: '불안', date: daysBefore(today, 2) },
    { id: 'guide-3', text: '슬픔, 지침', date: daysBefore(today, 4) },
  ]
}
