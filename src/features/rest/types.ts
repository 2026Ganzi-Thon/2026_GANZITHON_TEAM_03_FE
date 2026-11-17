// 휴식(rest) 기능 타입. 근거: docs/api/rest.md
import type { RestSession } from '@/shared/types'

export type {
  AfterMemoRequest,
  AfterMemoResponse,
  CancelRestResponse,
  CurrentRestResponse,
  RestSession,
  RestSessionResponse,
  RestStatus,
  StartRestRequest,
  StartRestResponse,
} from '@/shared/types'

/** 휴식을 시작하는 방법. 수동 버튼과 센서 감지가 같은 API를 호출한다(센서값은 서버에 저장하지 않는다). */
export type RestStartMode = 'manual' | 'sensor'

/**
 * 화면 단계. 완료 여부는 서버 시각 기준이라 클라이언트의 경과 시간이나 센서값으로 확정하지 않는다.
 * - idle: 진행 중·최근 세션이 없음
 * - running: 진행 중
 * - ended: 정상 완료 또는 중도 종료 (후 메모를 쓸 수 있음)
 */
export type RestPhase = 'idle' | 'running' | 'ended'

/**
 * 남은 시간 표시용 값. `serverOffsetMs`는 (서버 시각 - 기기 시각)이고,
 * 남은 시간은 `scheduledEndAt - (기기 현재 시각 + serverOffsetMs)`로 계산한다.
 * 앱에 돌아왔을 때는 현재 휴식 상태를 다시 조회한다(매초 서버 호출 금지).
 */
export interface RestTimer {
  serverOffsetMs: number
  remainingSeconds: number
}

/** 휴식 후 상태 기록 폼. 비어 있으면 서버에는 null을 보내 삭제한다. */
export interface AfterMemoFormValues {
  /** 최대 500자 (제안) */
  afterMemo: string
}

/**
 * 받아 둔 현재 휴식 상태. 응답을 받은 순간 (서버 시각 - 기기 시각)을 재 두어서, 캐시에서 다시 꺼내 써도
 * 남은 시간을 서버 기준으로 계산할 수 있게 한다(응답의 serverTime 은 받은 순간에만 의미가 있다).
 */
export interface RestSnapshot {
  /** 이력이 아예 없으면 null */
  session: RestSession | null
  serverOffsetMs: number
}

export type RestState =
  | { status: 'loading' }
  | { status: 'error' }
  | ({ status: 'success' } & RestSnapshot)

export type StartRestSessionState =
  | { status: 'idle' }
  | { status: 'starting' }
  /** 이미 진행 중인 휴식이 있음(409 REST_ALREADY_RUNNING) — 현재 상태를 다시 받는다 */
  | { status: 'already-running' }
  | { status: 'error' }

export type CancelRestSessionState =
  | { status: 'idle' }
  | { status: 'cancelling' }
  | { status: 'error' }

/** 현재 세션이 없으면 null */
export type CurrentRestSession = RestSession | null

/**
 * 동굴 섬 위에 놓아 보일 가구(섬 꾸미기에서 산 것). 섬 꾸미기 기능 소관이라 페이지가 그 데이터를 이 모양으로 바꿔 넘긴다.
 * 그림은 섬과 같은 크기의 투명 그림이라 자리·크기가 그림 안에 있다.
 */
export interface CaveDecoration {
  id: string
  name: string
  /** 섬 위에 놓인 모습(섬과 같은 크기의 투명 그림) */
  src: string
  /** 겹치는 순서. 작을수록 아래 */
  order: number
  /** 물에 떠 있으면 흔들림 중심(%) — 물결 박자에 맞춰 까딱인다 */
  floatAt: { x: number; y: number } | null
}
