import { hydrate } from '@tanstack/react-query'
import type { DehydratedState, Query, QueryKey } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { persistQueryClientSubscribe } from '@tanstack/react-query-persist-client'
import type { PersistedClient } from '@tanstack/react-query-persist-client'
import { accountKeys } from '@/features/account'
import { careKeys } from '@/features/care'
import { cheeseKeys } from '@/features/cheese'
import { emotionKeys } from '@/features/emotion'
import { homeKeys } from '@/features/home'
import { getTodaySeoul } from '@/shared/lib/formatRelativeDate'
import { idbStorage } from '@/shared/lib/idbStorage'
import type { HomeSummaryResponse, MyInfo, TodayCareCompletionsResponse } from '@/shared/types'
import { woolKeys } from '@/shared/wool'
import { queryClient } from './queryClient'

// 서버 데이터 캐시(TanStack Query)를 IndexedDB 에 저장해 두었다가, 앱을 다시 열면 지난 값을 바로 보여 주고 뒤에서 서버 값으로 갱신한다.
// iPhone PWA 는 백그라운드에서 자주 종료돼 다시 열 때마다 홈·목록이 스켈레톤부터 시작하던 것을 줄인다.
//
// 계정 안전: 저장본에 주인(회원 id = Access Token 의 sub)을 함께 적고(buster 에 넣는다), 세션 복원으로 확인된 사용자와 같을 때만
// 되살린다. 다르면 바로 지운다. 되살리기는 세션 복원(쿠키로 토큰 재발급)이 끝난 뒤에만 — 그 전에는 화면에 아무것도 안 그린다(AppShell).
// 세션을 닫으면(로그아웃·로그인 풀림·계정 바꾸기·비밀번호 재설정) 저장을 멈추고 저장본을 지운다(session.ts closeSession).

const DAY = 24 * 60 * 60 * 1000

/** 저장본을 되살리는 최대 나이. 저장 대상 쿼리의 gcTime 도 이 이상이어야 화면에 없는 동안 캐시에서 사라지지 않는다 */
// 임의 결정(확인 필요): 7일 — 일주일 넘게 안 연 앱은 처음처럼 서버에서 받는다
const MAX_AGE = 7 * DAY

const STORAGE_KEY = 'polly.queryCache'

/** 저장 형식 버전. 저장본의 모양(키·필터)을 바꾸면 올린다 */
const FORMAT_VERSION = 1

// 임의 결정(확인 필요): 앱 빌드(커밋)가 바뀌면 옛 저장본을 버린다 — 응답 모양이 바뀐 배포 뒤 옛 값이 화면을 깨지 않게.
// 배포마다 한 번은 스켈레톤부터 시작하는 대신 형식 버전을 손으로 올리다 빠뜨리는 위험이 없다.
const busterFor = (owner: string) => `v${FORMAT_VERSION}:${__APP_BUILD_ID__}:u${owner}`

/**
 * 저장할 쿼리(허용 목록). "다시 열면 바로 보여야 하는 목록·요약"만 고른다.
 * 고민 상세 본문·받은 위로·감정 기록 한 건·위로할 남의 고민 목록·휴식 상태·약관 내역·양털 내역·섬 꾸미기는 저장하지 않는다
 * (docs/decisions.md 2026-11-19 "앱 다시 열 때 지난 값 먼저").
 */
const PERSISTED_KEYS: readonly QueryKey[] = [
  homeKeys.summary(),
  woolKeys.wallet(),
  accountKeys.me(),
  emotionKeys.list(),
  emotionKeys.records(),
  careKeys.actions(),
  careKeys.today(),
  cheeseKeys.myConcerns(),
  cheeseKeys.savedConcerns(),
]

const persistedHashes = new Set(PERSISTED_KEYS.map((key) => JSON.stringify(key)))

const isPersistedKey = (queryKey: QueryKey) => persistedHashes.has(JSON.stringify(queryKey))

// 저장 대상은 화면에 없어도 maxAge 동안 캐시에 남긴다 — 그 전에 사라지면 다음 저장본에서도 빠진다(TanStack persist 규칙)
for (const queryKey of PERSISTED_KEYS) queryClient.setQueryDefaults(queryKey, { gcTime: MAX_AGE })

/**
 * "오늘" 데이터는 저장된 날(서버 시간대 Asia/Seoul)이 오늘일 때만 되살린다 — 어제 완료가 오늘 완료로 보이지 않게.
 * 날짜가 바뀌었으면 버리고 화면이 스켈레톤부터 새로 받는다. 감정 기록 목록은 기록마다 날짜가 있어 화면이 오늘과 비교하므로 그대로 둔다.
 */
function isStillToday(queryKey: QueryKey, data: unknown, today: string): boolean {
  const hash = JSON.stringify(queryKey)
  if (hash === JSON.stringify(homeKeys.summary())) return (data as HomeSummaryResponse | undefined)?.today === today
  if (hash === JSON.stringify(careKeys.today())) return (data as TodayCareCompletionsResponse | undefined)?.actionDate === today
  return true
}

const shouldDehydrateQuery = (query: Query) => query.state.status === 'success' && isPersistedKey(query.queryKey)

// ── 저장 ────────────────────────────────────────────────

interface PersistSession {
  owner: string
  alive: boolean
  unsubscribe: () => void
}

let current: PersistSession | null = null

/**
 * 세션마다 persister 를 새로 만든다. 쓰기는 1초에 한 번으로 모으는데(throttle), 세션을 닫은 뒤에 늦게 도착한 쓰기가
 * 지운 저장본을 되살리지 않게 alive 를 확인한다.
 */
function createSessionPersister(session: { alive: boolean }) {
  return createAsyncStoragePersister({
    key: STORAGE_KEY,
    throttleTime: 1000,
    storage: {
      getItem: idbStorage.getItem,
      setItem: async (key: string, value: string) => {
        if (session.alive) await idbStorage.setItem(key, value)
      },
      removeItem: idbStorage.removeItem,
    },
  })
}

/**
 * 로그인한 사용자의 캐시를 저장하기 시작한다(session.ts openSession). 이미 같은 주인으로 저장 중이면 그대로.
 * 이번 실행에서 그 주인의 저장본을 되살리지 않았으면(직접 로그인 등) 남아 있는 저장본을 먼저 지운다 — 다른 계정의 것일 수 있다.
 */
export function startQueryPersist(owner: string | null) {
  if (current?.owner === owner) return
  stopQueryPersist()
  // 주인을 알 수 없으면(토큰을 못 읽음) 저장하지 않는다
  if (!owner) return
  if (restoredOwner !== owner) void idbStorage.removeItem(STORAGE_KEY)
  const session: PersistSession = { owner, alive: true, unsubscribe: () => {} }
  session.unsubscribe = persistQueryClientSubscribe({
    queryClient,
    persister: createSessionPersister(session),
    buster: busterFor(owner),
    dehydrateOptions: { shouldDehydrateQuery, shouldDehydrateMutation: () => false },
  })
  current = session
}

function stopQueryPersist() {
  if (!current) return
  current.alive = false
  current.unsubscribe()
  current = null
}

/** 저장을 멈추고 저장본을 지운다(세션을 닫을 때) */
export function clearPersistedQueryCache() {
  stopQueryPersist()
  restoredOwner = null
  pendingRead = null
  void idbStorage.removeItem(STORAGE_KEY)
}

// ── 되살리기 ─────────────────────────────────────────────

/** 이번 실행에서 저장본을 되살린 주인. 같은 주인으로 저장을 시작할 때 저장본을 지우지 않는다 */
let restoredOwner: string | null = null
let pendingRead: Promise<PersistedClient | null> | null = null

/** IndexedDB 가 응답하지 않을 때 세션 복원을 붙잡지 않는 최대 시간 */
const READ_TIMEOUT_MS = 1000

/**
 * 저장본을 미리 읽어 둔다(앱을 열자마자, 토큰 재발급과 함께). 메모리에 읽기만 하고 캐시에 넣지 않는다 — 주인을 확인하기 전이라서.
 */
export function prereadPersistedQueryCache() {
  pendingRead ??= (async () => {
    const raw = await idbStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as PersistedClient
    } catch {
      return null
    }
  })()
}

/**
 * 세션 복원으로 확인된 사용자(owner)의 저장본만 캐시에 되살린다. 주인·빌드가 다르거나, 오래됐거나, 읽을 수 없으면 지운다.
 * 되살린 값은 오래된 것으로 표시해 화면에 붙자마자 다시 받는다(데이터는 같은 자리에서 바뀐다).
 * 되살린 내 정보(MyInfo)를 돌려준다 — 세션을 바로 열 수 있는지 판단에 쓴다(session.ts). shouldApply 가 false 면 넣지 않는다.
 */
export async function restorePersistedQueryCache(
  owner: string | null,
  shouldApply: () => boolean = () => true,
): Promise<MyInfo | undefined> {
  prereadPersistedQueryCache()
  const read = pendingRead!
  pendingRead = null
  const saved = await Promise.race([
    read.catch(() => null),
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), READ_TIMEOUT_MS)),
  ])
  // 읽는 동안 세션이 바뀌었으면(직접 로그인·로그아웃) 넣지 않는다
  if (!saved || !shouldApply()) return undefined
  const valid =
    owner !== null &&
    saved.buster === busterFor(owner) &&
    typeof saved.timestamp === 'number' &&
    Date.now() - saved.timestamp <= MAX_AGE &&
    Array.isArray(saved.clientState?.queries)
  if (!valid) {
    void idbStorage.removeItem(STORAGE_KEY)
    return undefined
  }

  const today = getTodaySeoul()
  const queries = saved.clientState.queries.filter(
    (query) =>
      query.state.status === 'success' && isPersistedKey(query.queryKey) && isStillToday(query.queryKey, query.state.data, today),
  )
  const state: DehydratedState = { mutations: [], queries }
  hydrate(queryClient, state)
  const restored = new Set(queries.map((query) => query.queryHash))
  void queryClient.invalidateQueries({ predicate: (query) => restored.has(query.queryHash), refetchType: 'none' })
  restoredOwner = owner
  return queryClient.getQueryData<MyInfo>(accountKeys.me())
}
