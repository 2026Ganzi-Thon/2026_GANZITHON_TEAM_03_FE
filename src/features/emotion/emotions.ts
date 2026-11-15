import type { Emotion } from './types'

// mock 감정 목록의 출처(emotionApi 의 fetchEmotions·mock 기록만 쓴다). 화면은 이 상수를 직접 쓰지 않고 쿼리로 받는다.
// 서버 감정 ID·code 와 맞춰야 한다. API 연결 때 함께 지운다.
// 임의 결정(확인 필요): 감정 7개와 code(JOY…CALM)를 임의로 만들었다 — Figma 칩 이름 그대로, 실제 목록은 기획 합의 필요
export const EMOTIONS: Emotion[] = [
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
