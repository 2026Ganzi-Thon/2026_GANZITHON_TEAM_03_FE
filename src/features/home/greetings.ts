export interface Greeting {
  /** 첫째 줄 */
  first: string
  /** 둘째 줄 */
  second: string
}

/** 닉네임이 없을 때 대신 부르는 이름 */
// 임의 결정(확인 필요): 닉네임이 null 이면 "폴리"로 부른다 — Figma 시안의 이름
export const FALLBACK_NAME = '폴리'

// 임의 결정(확인 필요): 인사말 문구 7개를 임의로 만들고 홈에 들어올 때마다 무작위로 보여준다 — 담당자 요청(첫째만 Figma 원문)
const TEMPLATES: Array<(name: string) => Greeting> = [
  (name) => ({ first: `${name}님 안녕하세요,`, second: '오늘도 좋은 아침이에요.' }),
  (name) => ({ first: `${name}님, 어서 오세요.`, second: '오늘 마음은 어때요?' }),
  (name) => ({ first: `${name}님, 오늘도 와주었네요.`, second: '편하게 쉬어가요.' }),
  (name) => ({ first: `다시 만나서 반가워요, ${name}님.`, second: '오늘 하루는 어땠나요?' }),
  (name) => ({ first: `${name}님 안녕하세요,`, second: '천천히 숨 한번 쉬어볼까요?' }),
  (name) => ({ first: `${name}님, 오늘도 수고했어요.`, second: '섬에서 푹 쉬어가요.' }),
  (name) => ({ first: `${name}님의 섬에 온 걸 환영해요.`, second: '양들도 기다리고 있었어요.' }),
]

export const GREETING_COUNT = TEMPLATES.length

/** 인사말 번호를 무작위로 고른다. 렌더 중이 아니라 `useState` 지연 초기화에서만 부른다. */
export function pickGreetingIndex(): number {
  return Math.floor(Math.random() * TEMPLATES.length)
}

export function getGreeting(index: number, nickname: string | null): Greeting {
  return TEMPLATES[index % TEMPLATES.length](nickname ?? FALLBACK_NAME)
}
