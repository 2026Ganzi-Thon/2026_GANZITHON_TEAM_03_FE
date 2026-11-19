// 설치 안내를 이 기기에서 본 적이 있는지(localStorage). storage 를 못 쓰면 이번 실행 동안만 메모리로 기억한다.

const KEY = 'polly.installPrompt'

export type InstallPromptOutcome = 'shown' | 'accepted' | 'dismissed' | 'installed'

interface SeenRecord {
  outcome: InstallPromptOutcome
  at: string
}

let memory: SeenRecord | null = null

function read(): SeenRecord | null {
  if (memory) return memory
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SeenRecord) : null
  } catch {
    return null
  }
}

function write(outcome: InstallPromptOutcome) {
  memory = { outcome, at: new Date().toISOString() }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(memory))
  } catch {
    // 저장하지 못해도 이번 실행 동안은 메모리 값으로 다시 띄우지 않는다
  }
}

export function hasSeenInstallPrompt(): boolean {
  return read() !== null
}

/** 팝업을 띄운 순간 본 것으로 친다(닫기·다음에·설치하기 무엇을 눌러도 다시 안 뜬다) */
export function markInstallPromptShown() {
  write('shown')
}

/** "설치하기"를 누른 결과(`userChoice`) */
export function recordInstallChoice(outcome: 'accepted' | 'dismissed') {
  write(outcome)
}

/** `appinstalled` — 설치됐으면 다시 띄우지 않는다 */
export function markInstalled() {
  write('installed')
}
