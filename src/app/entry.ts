// TODO(임시): 로그인 API 가 없어 실제 로그인 여부를 알 수 없다. 로그인 API 연결 시 토큰 확인으로 교체한다.
// 임의 결정(확인 필요): 그 전까지 "이번 세션(탭)에 시작 흐름(로그인·초기 설정)을 통과했는지"를 sessionStorage 로,
// "온보딩을 본 적이 있는지"를 localStorage 로 본다. 같은 탭 새로고침은 그대로 머물고, 앱을 새로 열면 스플래시부터.
// storage 를 못 쓰는 환경(사파리 비공개 모드 등)에서는 메모리 값으로만 기억한다(새로고침하면 다시 시작 흐름).

// 기존 `polly.entryPassed`는 입력값 없이도 홈으로 보냈던 임시 로그인에서 기록될 수 있어 새 키로 분리한다.
const PASSED_KEY = 'polly.entryPassed.v2'
const ONBOARDING_KEY = 'polly.onboardingSeen'
const MOCK_AUTH_KEY = 'polly.devMockAuth'

const memory = { passed: false, onboardingSeen: false }

function read(storage: () => Storage, key: string): boolean {
  try {
    return storage().getItem(key) === '1'
  } catch {
    return false
  }
}

function write(storage: () => Storage, key: string) {
  try {
    storage().setItem(key, '1')
  } catch {
    // 저장하지 못해도 메모리 값으로 이번 실행 동안은 넘어간다
  }
}

/** 이번 세션에 시작 흐름을 통과했는지 */
export function hasPassedEntry(): boolean {
  // Local-only shortcut for screen demos. This only passes the app entry guard;
  // it does not create an OAuth token or a backend-authenticated session.
  if (import.meta.env.DEV) {
    const mockAuth = new URLSearchParams(window.location.search).get('mockAuth')
    if (mockAuth === '1') {
      try {
        window.sessionStorage.setItem(MOCK_AUTH_KEY, '1')
      } catch {
        // Continue for this check even when sessionStorage is unavailable.
      }
      return true
    }
    if (mockAuth === '0') {
      try {
        window.sessionStorage.removeItem(MOCK_AUTH_KEY)
      } catch {
        // The shortcut remains limited to this page load.
      }
    } else if (read(() => window.sessionStorage, MOCK_AUTH_KEY)) {
      return true
    }
  }
  return memory.passed || read(() => window.sessionStorage, PASSED_KEY)
}

/** 로그인·초기 설정을 끝냈을 때 */
export function markEntryPassed() {
  memory.passed = true
  write(() => window.sessionStorage, PASSED_KEY)
}

/** 온보딩을 본 적이 있는지 */
export function hasSeenOnboarding(): boolean {
  return memory.onboardingSeen || read(() => window.localStorage, ONBOARDING_KEY)
}

/** 온보딩을 끝내거나 건너뛰었을 때 */
export function markOnboardingSeen() {
  memory.onboardingSeen = true
  write(() => window.localStorage, ONBOARDING_KEY)
}

/** 시연 초기화(`?reset`): 시작 흐름 기록을 지운다 */
export function clearEntry() {
  memory.passed = false
  memory.onboardingSeen = false
  try {
    window.sessionStorage.removeItem(PASSED_KEY)
    window.sessionStorage.removeItem(MOCK_AUTH_KEY)
  } catch {
    // 못 지워도 메모리 값은 비웠다
  }
  try {
    window.localStorage.removeItem(ONBOARDING_KEY)
  } catch {
    // 위와 같음
  }
}
