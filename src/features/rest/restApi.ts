import { api } from '@/shared/api'
import type { AfterMemoResponse, CancelRestResponse, CurrentRestResponse, StartRestResponse } from './types'

// 휴식 API. 응답·오류 코드는 백엔드 RestSessionController·RestService 기준.
// 서버는 예정 종료가 지난 RUNNING 세션을 응답에서 COMPLETED(endedAt = scheduledEndAt)로 계산해 준다.

/** 시작: 허용 범위(60~3,600초) 밖(400) */
export const REST_INVALID_DURATION = 'REST_INVALID_DURATION'
/** 시작: 아직 시간이 남은 휴식이 있음(409) */
export const REST_ALREADY_RUNNING = 'REST_ALREADY_RUNNING'
/** 중도 종료·후 메모: 없거나 내 휴식이 아님(404) */
export const REST_SESSION_NOT_FOUND = 'REST_SESSION_NOT_FOUND'
/** 후 메모: 아직 예정 종료 전인 진행 중 휴식(409) */
export const REST_NOT_ENDED = 'REST_NOT_ENDED'
/** 후 메모 최대 글자 수(백엔드 app.activity.after-memo-limit 기본 500, 코드 포인트 기준) */
export const AFTER_MEMO_MAX_LENGTH = 500

/** 현재 휴식 상태(가장 최근 세션, 이력이 없으면 session null). `GET /api/v1/rest-sessions/current` 의 `data`. */
export function fetchCurrentRestSession(): Promise<CurrentRestResponse> {
  return api.get<CurrentRestResponse>('/rest-sessions/current')
}

/**
 * 휴식을 시작한다(201). `POST /api/v1/rest-sessions`, `Idempotency-Key` 필수 — 같은 시작 시도를 다시 보낼 때는 같은 키를 쓴다
 * (useStartRestSession 이 시도마다 만든다). 오류: 400 REST_INVALID_DURATION, 409 REST_ALREADY_RUNNING.
 */
export function startRestSession(plannedDurationSeconds: number, idempotencyKey: string): Promise<StartRestResponse> {
  return api.post<StartRestResponse>('/rest-sessions', { plannedDurationSeconds }, { idempotencyKey })
}

/**
 * 휴식을 중도 종료한다(본문 없음). 예정 종료 전이면 CANCELLED, 이미 지났으면 COMPLETED, 이미 끝난 세션은 그대로 200.
 * 없는 세션은 404 REST_SESSION_NOT_FOUND. `POST /api/v1/rest-sessions/{sessionId}/cancel`.
 */
export function cancelRestSession(sessionId: string): Promise<CancelRestResponse> {
  return api.post<CancelRestResponse>(`/rest-sessions/${encodeURIComponent(sessionId)}/cancel`)
}

/**
 * 끝난 휴식(정상 완료·중도 종료 모두)에 한 줄 메모를 남기거나 고치거나 지운다(null·공백뿐이면 지움).
 * `PATCH /api/v1/rest-sessions/{sessionId}/after-memo`, 본문 `{ afterMemo }` — 필드를 빼면 400. Idempotency-Key 없음(같은 값을 다시 보내도 결과가 같다).
 * 오류: 400 COMMON_INVALID_REQUEST(500자 초과·형식), 404 REST_SESSION_NOT_FOUND, 409 REST_NOT_ENDED(예정 종료 전), 409 COMMON_STATE_CONFLICT(잠금 충돌).
 */
export function saveAfterMemo(sessionId: string, afterMemo: string | null): Promise<AfterMemoResponse> {
  return api.patch<AfterMemoResponse>(`/rest-sessions/${encodeURIComponent(sessionId)}/after-memo`, { afterMemo })
}
