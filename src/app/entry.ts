// 온보딩을 본 적이 있는지(localStorage). 로그인 여부는 ./session.ts(토큰 기준)가 맡는다.
// storage 를 못 쓰는 환경(사파리 비공개 모드 등)에서는 메모리 값으로만 기억한다.

const ONBOARDING_KEY = 'polly.onboardingSeen'
// 예전 임시 로그인(이번 탭에 시작 흐름을 통과했는지)이 쓰던 키 — 지금은 쓰지 않아 지운다
const LEGACY_PASSED_KEYS = ['polly.entryPassed', 'polly.entryPassed.v2']
// 섬 꾸미기 API 가 생기기 전 기기에 두던 가짜 DB(산 가구 ID) — 지금은 서버가 보유를 준다. 남은 것을 지운다
const LEGACY_LOCAL_KEYS = ['polly.mockDb']

const memory = { onboardingSeen: false }

/** 온보딩을 본 적이 있는지 */
export function hasSeenOnboarding(): boolean {
  if (memory.onboardingSeen) return true
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === '1'
  } catch {
    return false
  }
}

/** 온보딩을 끝내거나 건너뛰었을 때 */
export function markOnboardingSeen() {
  memory.onboardingSeen = true
  try {
    window.localStorage.setItem(ONBOARDING_KEY, '1')
  } catch {
    // 저장하지 못해도 메모리 값으로 이번 실행 동안은 넘어간다
  }
}

/** 시연 초기화(`?reset`): 온보딩 본 기록을 지운다 */
export function clearOnboardingSeen() {
  memory.onboardingSeen = false
  try {
    window.localStorage.removeItem(ONBOARDING_KEY)
  } catch {
    // 못 지워도 메모리 값은 비웠다
  }
}

/** 예전 임시 로그인 기록과 섬 꾸미기 가짜 DB 를 지운다(앱 시작 때 한 번) */
export function clearLegacyEntry() {
  for (const key of LEGACY_PASSED_KEYS) {
    try {
      window.sessionStorage.removeItem(key)
    } catch {
      // 지우지 못해도 읽는 곳이 없다
    }
  }
  for (const key of LEGACY_LOCAL_KEYS) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // 지우지 못해도 읽는 곳이 없다
    }
  }
}
