// 야간 알림(22:00~07:00) 켬/끔.
// 임의 결정(확인 필요): 백엔드·명세에 알림 설정이 없어 이 기기 localStorage 에만 저장한다(다른 기기·재설치에는 안 따라감).
// storage 를 못 쓰면(사파리 비공개 모드 등) 메모리로만 기억한다. 기본값은 켜짐(시안 290:891).
// 알림 설정 API 가 생기면 내 정보처럼 서버에서 읽고 쓰도록 바꾼다.

const STORAGE_KEY = 'polly.nightAlarm'
const DEFAULT_ON = true

let memory: boolean | null = null

export function loadNightAlarm(): boolean {
  if (memory !== null) return memory
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === 'on') return true
    if (raw === 'off') return false
  } catch {
    // 읽지 못하면 기본값
  }
  return DEFAULT_ON
}

export function saveNightAlarm(on: boolean): void {
  memory = on
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // 저장하지 못해도 메모리 값으로 이번 실행 동안은 이어진다
  }
}
