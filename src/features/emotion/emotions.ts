import type { Emotion } from './types'

// 감정 목록은 자주 바뀌지 않아 서버에서 받지 않고 로컬 상수로 둔다 — 로딩 없이 바로 보인다.
// 서버 감정 ID·code 와 맞춰야 한다. 백엔드 목록이 확정되면 이 상수를 고친다.
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
