// 휴식(rest) 기능 타입. 근거: docs/api/rest.md
import type { CurrentRestResponse, RestSession } from '@/shared/types'

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

export type RestState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: CurrentRestResponse }

/** 현재 세션이 없으면 null */
export type CurrentRestSession = RestSession | null
