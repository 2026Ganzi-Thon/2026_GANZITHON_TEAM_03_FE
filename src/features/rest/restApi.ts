import { ApiError } from '@/shared/api'
import { mockDb, mockDelay } from '@/shared/mock'
import type { CancelRestResponse, CurrentRestResponse, RestSession, StartRestResponse } from './types'

// 휴식 API(docs/api/rest.md, 초안). 지금은 가짜 DB(`@/shared/mock`)로 서버의 상태 규칙을 흉내 낸다.
// TODO(API 연결): 로그인이 붙으면 아래 세 함수의 본문을 호출 한 줄로 바꾸고 `@/shared/mock` import·흉내 코드(resolve 등)를 지운다.
// (api 는 `@/shared/api`. 시작은 `Idempotency-Key` 가 필요하다 — useStartRestSession 이 한 번의 시작 시도마다 키를 만들어 넘긴다.)

export const REST_INVALID_DURATION = 'REST_INVALID_DURATION'
export const REST_ALREADY_RUNNING = 'REST_ALREADY_RUNNING'
export const REST_SESSION_NOT_FOUND = 'REST_SESSION_NOT_FOUND'

/** 허용 휴식 시간(초). 명세 제안값 60~3,600 */
const MIN_DURATION_SECONDS = 60
const MAX_DURATION_SECONDS = 3600

/**
 * 서버의 응답 계산 흉내: DB 가 `RUNNING` 이어도 예정 종료를 지났으면 `COMPLETED`, `endedAt = scheduledEndAt` 으로 준다.
 * 클라이언트 경과 시간이 아니라 서버 시각(`nowMs`)으로 판단한다.
 */
function resolve(session: RestSession, nowMs: number): RestSession {
  if (session.status === 'RUNNING' && nowMs >= Date.parse(session.scheduledEndAt)) {
    return { ...session, status: 'COMPLETED', endedAt: session.scheduledEndAt }
  }
  return session
}

/** 진행 중 세션을 우선으로, 없으면 가장 최근 세션(계산된 상태). 이력이 없으면 null */
function currentSession(nowMs: number): RestSession | null {
  const sessions = mockDb.rest.list().map((session) => resolve(session, nowMs))
  return sessions.find((session) => session.status === 'RUNNING') ?? sessions[0] ?? null
}

/**
 * 현재 휴식 상태. `GET /api/v1/rest-sessions/current` 의 `data`. DB 를 바꾸지 않는다.
 * TODO(API 연결): return api.get<CurrentRestResponse>('/rest-sessions/current')
 */
export async function fetchCurrentRestSession(): Promise<CurrentRestResponse> {
  await mockDelay()
  const nowMs = Date.now()
  const session = currentSession(nowMs)
  const remainingSeconds =
    session?.status === 'RUNNING' ? Math.max(0, Math.ceil((Date.parse(session.scheduledEndAt) - nowMs) / 1000)) : 0
  return { serverTime: new Date(nowMs).toISOString(), remainingSeconds, session }
}

/**
 * 휴식을 시작한다. `POST /api/v1/rest-sessions` (201, `Idempotency-Key` 필요).
 * 허용 범위 밖이면 400 REST_INVALID_DURATION, 아직 시간이 남은 세션이 있으면 409 REST_ALREADY_RUNNING 을 흉내 낸다.
 * TODO(API 연결): return api.post<StartRestResponse>('/rest-sessions', { plannedDurationSeconds }, { idempotencyKey })
 */
export async function startRestSession(plannedDurationSeconds: number, idempotencyKey: string): Promise<StartRestResponse> {
  void idempotencyKey // mock 은 키를 쓰지 않는다 — 실제 호출에서 헤더로 보낸다
  await mockDelay()
  if (
    !Number.isInteger(plannedDurationSeconds) ||
    plannedDurationSeconds < MIN_DURATION_SECONDS ||
    plannedDurationSeconds > MAX_DURATION_SECONDS
  ) {
    throw new ApiError(400, { code: REST_INVALID_DURATION, message: '휴식 시간을 다시 골라 주세요.' })
  }
  const nowMs = Date.now()
  for (const row of mockDb.rest.list()) {
    if (row.status !== 'RUNNING') continue
    const resolved = resolve(row, nowMs)
    if (resolved.status === 'RUNNING') {
      throw new ApiError(409, { code: REST_ALREADY_RUNNING, message: '이미 쉬고 있어요.' })
    }
    // 예정 종료를 지난 RUNNING 행은 새 세션을 만들기 전에 COMPLETED 로 정리한다(명세 메모, 같은 트랜잭션)
    mockDb.rest.update(row.sessionId, { status: resolved.status, endedAt: resolved.endedAt })
  }
  const startedAt = new Date(nowMs).toISOString()
  const session = mockDb.rest.create({
    plannedDurationSeconds,
    startedAt,
    scheduledEndAt: new Date(nowMs + plannedDurationSeconds * 1000).toISOString(),
    endedAt: null,
    status: 'RUNNING',
    afterMemo: null,
  })
  return { serverTime: startedAt, session }
}

/**
 * 휴식을 중도 종료한다. `POST /api/v1/rest-sessions/{sessionId}/cancel`.
 * 예정 종료 전이면 CANCELLED(`endedAt` = 서버 현재 시각), 이미 지났으면 COMPLETED(`endedAt = scheduledEndAt`),
 * 이미 끝난 세션은 그대로 돌려준다. 없는 세션은 404 REST_SESSION_NOT_FOUND.
 * TODO(API 연결): return api.post<CancelRestResponse>(`/rest-sessions/${sessionId}/cancel`)
 */
export async function cancelRestSession(sessionId: string): Promise<CancelRestResponse> {
  await mockDelay()
  const row = mockDb.rest.list().find((item) => item.sessionId === sessionId)
  if (!row) throw new ApiError(404, { code: REST_SESSION_NOT_FOUND, message: '휴식을 찾지 못했어요.' })
  if (row.status !== 'RUNNING') return { session: row }

  const nowMs = Date.now()
  const resolved = resolve(row, nowMs)
  const patch =
    resolved.status === 'COMPLETED'
      ? { status: resolved.status, endedAt: resolved.endedAt }
      : { status: 'CANCELLED' as const, endedAt: new Date(nowMs).toISOString() }
  return { session: mockDb.rest.update(sessionId, patch) ?? { ...row, ...patch } }
}
