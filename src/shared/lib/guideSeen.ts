// 화면마다 "처음이신가요?" 안내 말풍선을 이 기기에서 본 적이 있는지(localStorage). storage 를 못 쓰면 이번 실행 동안만 메모리로 기억한다.

const KEY = 'polly.guideSeen'

export type GuideScreen = 'emotion' | 'cheese' | 'vault' | 'wool' | 'cave'

let memory: GuideScreen[] | null = null

function read(): GuideScreen[] {
  if (memory) return memory
  try {
    const raw = window.localStorage.getItem(KEY)
    memory = raw ? (JSON.parse(raw) as GuideScreen[]) : []
  } catch {
    memory = []
  }
  return memory
}

export function hasSeenGuide(screen: GuideScreen): boolean {
  return read().includes(screen)
}

/** 말풍선이 뜬 순간 본 것으로 친다 — 아무것도 누르지 않고 나가도 다시 뜨지 않는다 */
export function markGuideSeen(screen: GuideScreen) {
  const seen = read()
  if (seen.includes(screen)) return
  memory = [...seen, screen]
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memory))
  } catch {
    // 저장하지 못해도 이번 실행 동안은 메모리 값으로 다시 띄우지 않는다
  }
}
