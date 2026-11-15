// 휴식 API 타입 - docs/api/rest.md 기준
import type { Id, IsoDateTime } from './common'

export type RestStatus = 'RUNNING' | 'COMPLETED' | 'CANCELLED'

export interface RestSession {
  sessionId: Id
  /** 설정한 초 단위 휴식 시간 */
  plannedDurationSeconds: number
  startedAt: IsoDateTime
  scheduledEndAt: IsoDateTime
  endedAt: IsoDateTime | null
  status: RestStatus
  /** 최대 500자 (제안) */
  afterMemo: string | null
}

/** 휴식 시작. Idempotency-Key 헤더가 필요하다(제안). 시각·상태는 서버가 계산한다. */
export interface StartRestRequest {
  /** 60~3,600초 (제안) */
  plannedDurationSeconds: number
}

export interface StartRestResponse {
  /** 남은 시간 계산 기준 */
  serverTime: IsoDateTime
  session: RestSession
}

/** 현재 휴식 상태 조회 응답의 data */
export interface CurrentRestResponse {
  serverTime: IsoDateTime
  /** RUNNING은 max(0, ceil(예정 종료 - 현재)), 종료 상태·세션 없음은 0 */
  remainingSeconds: number
  /** 이력이 아예 없으면 null */
  session: RestSession | null
}

/** 휴식 중도 종료·휴식 후 상태 기록 응답의 data */
export interface RestSessionResponse {
  session: RestSession
}

export type CancelRestResponse = RestSessionResponse

/** afterMemo는 생략 불가. null·공백뿐이면 삭제 */
export interface AfterMemoRequest {
  afterMemo: string | null
}

export type AfterMemoResponse = RestSessionResponse
