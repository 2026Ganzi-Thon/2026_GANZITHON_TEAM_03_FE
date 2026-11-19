// 설치 이벤트(`beforeinstallprompt`)를 앱 시작 직후 받아 둔다. 크롬은 페이지를 연 뒤 곧바로 보내기 때문에
// 화면이 그려진 뒤에 듣기 시작하면 놓친다 — main.tsx 가 화면보다 먼저 `captureInstallEvents()` 를 부른다.

import { markInstalled } from './seen'

/** 크롬·엣지·삼성 인터넷의 설치 이벤트(표준 lib 에 타입이 없다) */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferred: BeforeInstallPromptEvent | null = null
let captured = false
const listeners = new Set<() => void>()

function notify() {
  for (const listener of listeners) listener()
}

export function captureInstallEvents() {
  if (captured || typeof window === 'undefined') return
  captured = true
  window.addEventListener('beforeinstallprompt', (event) => {
    // 브라우저 기본 미니바(설치 배너)를 막고, 우리 팝업의 "설치하기"에서 띄운다
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    markInstalled()
    notify()
  })
}

export function getInstallEvent(): BeforeInstallPromptEvent | null {
  return deferred
}

export function subscribeInstallEvent(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 설치 창을 띄운다. 이벤트는 한 번만 쓸 수 있어 쓰고 나면 버린다. 결과를 돌려준다 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = deferred
  if (!event) return 'unavailable'
  deferred = null
  notify()
  try {
    await event.prompt()
    const choice = await event.userChoice
    return choice.outcome
  } catch {
    return 'unavailable'
  }
}
