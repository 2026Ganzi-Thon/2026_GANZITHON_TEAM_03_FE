// 섬 꾸미기 가짜 DB(서버 DB 역할). 백엔드에 섬 꾸미기 API 가 없어서 산 아이템 ID 만 이 기기의 localStorage 에 둔다.
// 메모리 상태 하나를 두고 쓸 때마다 저장, 처음 쓸 때 불러온다. storage 를 못 쓰면(사파리 비공개 모드 등) 메모리로만 동작한다.
// TODO(API 연결): 섬 꾸미기 API 가 생기면 이 파일과 폴더를 지운다(features/island/islandApi.ts 의 TODO).

const STORAGE_KEY = 'polly.mockDb'
// 1~4: 감정·고민·휴식·양털까지 흉내 내던 통합 가짜 DB. 5: 섬 꾸미기 보유만 남김(실제 API 연결)
const VERSION = 5

interface MockIslandState {
  ownedItemIds: string[]
}

let state: MockIslandState | null = null

function load(): MockIslandState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as { version?: number; ownedItemIds?: unknown; island?: { ownedItemIds?: unknown } }
      // 이전 형식(1~4)의 산 아이템도 이어받는다 — 시연 중 산 가구가 사라지지 않게
      const ids = saved.version === VERSION ? saved.ownedItemIds : saved.island?.ownedItemIds
      if (Array.isArray(ids)) return { ownedItemIds: ids.filter((id): id is string => typeof id === 'string') }
    }
  } catch {
    // 읽지 못하면 빈 상태로
  }
  return { ownedItemIds: [] }
}

function persist(next: MockIslandState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, ...next }))
  } catch {
    // 저장하지 못해도 메모리 상태로 이번 실행 동안은 이어진다
  }
}

function db(): MockIslandState {
  state ??= load()
  return state
}

export const mockIsland = {
  ownedItemIds: (): string[] => [...db().ownedItemIds],
  addOwnedItem(itemId: string) {
    const current = db()
    if (!current.ownedItemIds.includes(itemId)) current.ownedItemIds.push(itemId)
    persist(current)
  },
}

/** 시연 초기화(`?reset`): 산 아이템을 모두 지운다 */
export function resetMockIsland() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage 를 못 써도 메모리 상태는 아래에서 비운다
  }
  state = { ownedItemIds: [] }
}
