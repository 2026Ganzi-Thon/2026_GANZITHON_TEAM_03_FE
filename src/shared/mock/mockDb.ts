import { ApiError } from '@/shared/api'
import { getTodaySeoul } from '@/shared/lib/formatRelativeDate'
import type { Emotion, EmotionRecord, Id, IsoDateTime, Reply, RestSession } from '@/shared/types'
import { createSeed } from './seed'
import type { MockConcernRow, MockDbState, MockEmotionRecordRow, MockMyConcernRow } from './seed'

// 가짜 DB(서버 DB 역할). 메모리 상태 하나를 두고 쓸 때마다 localStorage 에 저장, 처음 쓸 때 불러온다.
// 저장 형식이 바뀌면 VERSION 을 올린다 — 버전이 다르거나 읽지 못하면 시드로 다시 시작한다.
// storage 를 못 쓰면(사파리 비공개 모드 등) 메모리로만 동작한다(새로고침하면 시드).

const STORAGE_KEY = 'polly.mockDb'
// 2: 휴식 세션(restSessions) 추가
// 3: 내가 쓴 고민(myConcerns) 추가
// 4: 내가 쓴 고민에 받은 위로(replies) 추가
const VERSION = 4

let state: MockDbState | null = null

function load(): MockDbState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const { version, ...rest } = JSON.parse(raw) as { version?: number } & MockDbState
      if (version === VERSION) return rest
    }
  } catch {
    // 읽지 못하면 시드로
  }
  const seed = createSeed()
  persist(seed)
  return seed
}

function persist(next: MockDbState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, ...next }))
  } catch {
    // 저장하지 못해도 메모리 상태로 이번 실행 동안은 이어진다
  }
}

function db(): MockDbState {
  state ??= load()
  return state
}

/** 상태를 바꾸고 저장한다 */
function write<T>(change: (draft: MockDbState) => T): T {
  const result = change(db())
  persist(db())
  return result
}

const now = (): IsoDateTime => new Date().toISOString()

/** 시연 초기화(`?reset`): 저장본을 지우고 시드로 다시 시작한다. */
export function resetMockDb() {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage 를 못 써도 메모리 상태는 아래에서 새로 만든다
  }
  state = createSeed()
  persist(state)
}

// 임의 결정(확인 필요): mock 응답에 0.3초 지연을 줘서 로딩 상태를 볼 수 있게 함 — API 연결 시 함께 지운다
export const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 300))

/** 서버 기준 "오늘"(Asia/Seoul) */
export const mockToday = () => getTodaySeoul()

/** 양털이 모자랄 때(409) `ApiError.code` — docs/api/care-wool.md 의 회수 오류 코드를 쓰기에도 같이 씀 */
export const WOOL_BALANCE_INSUFFICIENT = 'WOOL_BALANCE_INSUFFICIENT'

const clone = <T>(value: T): T => structuredClone(value)

function toEmotionRecord(row: MockEmotionRecordRow): EmotionRecord {
  const emotions: Emotion[] = db().emotions.filter((emotion) => row.emotionIds.includes(emotion.emotionId))
  return { recordId: row.recordId, recordDate: row.recordDate, memo: row.memo, createdAt: row.createdAt, updatedAt: row.updatedAt, emotions: clone(emotions) }
}

/** 기능의 *Api.ts 가 쓰는 읽기·쓰기. 돌려주는 값은 복사본이라 고쳐도 DB 에 반영되지 않는다. */
export const mockDb = {
  user: {
    get: () => clone(db().user),
    completeInitialProfile: (profile: { nickname: string; ageGroup: string | null; introduction: string }) =>
      write((draft) => {
        draft.user = { ...profile, profileCompleted: true }
        return clone(draft.user)
      }),
  },

  wool: {
    balance: () => clone(db().wool),
    /** 쓰기(섬 꾸미기 구매 등). 모자라면 409 `WOOL_BALANCE_INSUFFICIENT`. 반영 뒤 잔액을 돌려준다 */
    spend: (amount: number) =>
      write((draft) => {
        if (draft.wool.balance < amount) {
          throw new ApiError(409, { code: WOOL_BALANCE_INSUFFICIENT, message: '양털이 모자라요.' })
        }
        draft.wool = { balance: draft.wool.balance - amount, updatedAt: now() }
        return draft.wool.balance
      }),
    /** 쌓기(돌봄 행동 완료 등 — 아직 부르는 곳 없음). 반영 뒤 잔액을 돌려준다 */
    earn: (amount: number) =>
      write((draft) => {
        draft.wool = { balance: draft.wool.balance + amount, updatedAt: now() }
        return draft.wool.balance
      }),
  },

  emotion: {
    /** 감정 목록 전체(비활성 포함) */
    catalog: () => clone(db().emotions),
    /** 기록 목록(최신 날짜 먼저) */
    list: (): EmotionRecord[] => db().emotionRecords.map(toEmotionRecord),
    get: (recordId: Id): EmotionRecord | undefined => {
      const row = db().emotionRecords.find((item) => item.recordId === recordId)
      return row && toEmotionRecord(row)
    },
    findByDate: (recordDate: string): EmotionRecord | undefined => {
      const row = db().emotionRecords.find((item) => item.recordDate === recordDate)
      return row && toEmotionRecord(row)
    },
    create: (input: { recordDate: string; memo: string | null; emotionIds: Id[] }): EmotionRecord =>
      write((draft) => {
        const at = now()
        const row: MockEmotionRecordRow = { recordId: String(draft.nextEmotionRecordId++), ...input, createdAt: at, updatedAt: at }
        draft.emotionRecords.unshift(row)
        draft.emotionRecords.sort((a, b) => b.recordDate.localeCompare(a.recordDate))
        return toEmotionRecord(row)
      }),
    /** 지웠으면 true, 없으면 false */
    remove: (recordId: Id): boolean =>
      write((draft) => {
        const index = draft.emotionRecords.findIndex((item) => item.recordId === recordId)
        if (index === -1) return false
        draft.emotionRecords.splice(index, 1)
        return true
      }),
  },

  cheese: {
    list: (): MockConcernRow[] => clone(db().concerns),
    get: (concernId: Id): MockConcernRow | undefined => clone(db().concerns.find((item) => item.concernId === concernId)),
    markReplied: (concernId: Id) =>
      write((draft) => {
        const found = draft.concerns.find((item) => item.concernId === concernId)
        if (found) found.alreadyReplied = true
      }),
    /** 내가 쓴 고민(최신이 앞). 상태 계산은 하지 않은 원래 값 */
    listMine: (): MockMyConcernRow[] => clone(db().myConcerns),
    getMine: (concernId: Id): MockMyConcernRow | undefined =>
      clone(db().myConcerns.find((item) => item.concernId === concernId)),
    /** 개봉 표시(이미 열었으면 그대로). 위로가 하나도 없으면 `fallbackReply`(기본 위로)를 넣는다. 바뀐 행을 돌려준다 */
    openMine: (concernId: Id, fallbackReply: Omit<Reply, 'replyId' | 'createdAt'>): MockMyConcernRow | undefined =>
      write((draft) => {
        const row = draft.myConcerns.find((item) => item.concernId === concernId)
        if (!row) return undefined
        if (!row.openedAt) {
          const at = now()
          row.openedAt = at
          if (row.replies.length === 0) row.replies.push({ replyId: `${concernId}-system`, createdAt: at, ...fallbackReply })
        }
        return clone(row)
      }),
  },

  island: {
    ownedItemIds: () => [...db().island.ownedItemIds],
    addOwnedItem: (itemId: string) =>
      write((draft) => {
        if (!draft.island.ownedItemIds.includes(itemId)) draft.island.ownedItemIds.push(itemId)
      }),
  },

  rest: {
    /** 저장된 세션 행 전체(최근 것이 앞). 상태 계산(예정 종료 지남 → COMPLETED)은 하지 않은 원래 값 */
    list: (): RestSession[] => clone(db().restSessions),
    /** 새 세션을 만든다. ID 는 여기서 매긴다 */
    create: (input: Omit<RestSession, 'sessionId'>): RestSession =>
      write((draft) => {
        const row: RestSession = { sessionId: String(draft.nextRestSessionId++), ...input }
        draft.restSessions.unshift(row)
        return clone(row)
      }),
    /** 세션 행을 고친다. 없으면 undefined */
    update: (sessionId: Id, patch: Partial<Omit<RestSession, 'sessionId'>>): RestSession | undefined =>
      write((draft) => {
        const row = draft.restSessions.find((item) => item.sessionId === sessionId)
        if (!row) return undefined
        Object.assign(row, patch)
        return clone(row)
      }),
  },
}
