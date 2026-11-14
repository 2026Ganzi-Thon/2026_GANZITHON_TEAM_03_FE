// 고민·위로(치즈) API 타입 - docs/api/cheese.md 기준
import type { Id, IsoDateTime, PageParams, Paged } from './common'

/** MATURING 숙성 중 / MATURED 숙성 끝(아직 안 엶) / OPENED 개봉함 / SAVED 보관함 */
export type ConcernStatus = 'MATURING' | 'MATURED' | 'OPENED' | 'SAVED'

/** 공감이 필요해요 / 경험을 듣고 싶어요 / 조언도 괜찮아요 */
export type ComfortType = 'EMPATHY' | 'EXPERIENCE' | 'ADVICE'

export interface Reply {
  replyId: Id
  content: string
  /** 기본 위로(시스템 문구) 여부 */
  fromSystem: boolean
  createdAt: IsoDateTime
}

/** 고민 작성. Idempotency-Key 헤더가 필요하다(제안). */
export interface CreateConcernRequest {
  content: string
  comfortType: ComfortType
}

export interface CreateConcernResponse {
  concernId: Id
  status: 'MATURING'
  maturesAt: IsoDateTime
  createdAt: IsoDateTime
}

/** 위로할 고민 목록의 카드 (다른 사용자의 숙성 중 고민, 작성자 정보 없음) */
export interface ConcernCard {
  concernId: Id
  preview: string
  comfortType: ComfortType
  createdAt: IsoDateTime
}

/** 위로할 고민 목록 응답의 data. 페이지네이션 없이 최대 100개, count는 이번 응답의 개수 */
export interface ConcernListResponse {
  items: ConcernCard[]
  count: number
}

/** 고민 상세 조회 응답의 data. 받은 위로는 포함하지 않는다. */
export interface ConcernDetail {
  concernId: Id
  content: string
  comfortType: ComfortType
  createdAt: IsoDateTime
  /** 내 고민 여부 */
  mine: boolean
  status: ConcernStatus
  /** 내 고민일 때만 값, 타인에게는 null */
  maturesAt: IsoDateTime | null
  /** 지금 내가 위로를 남길 수 있는지 (내 고민이면 false) */
  replyable: boolean
  /** 내가 이미 위로를 남겼는지 (내 고민이면 false) */
  alreadyReplied: boolean
}

export interface CreateReplyRequest {
  content: string
}

export interface CreateReplyResponse {
  replyId: Id
  concernId: Id
  createdAt: IsoDateTime
}

/** 내 치즈 목록 쿼리 (size 기본 20, 1~50) */
export type MyConcernListParams = PageParams

export interface MyConcernItem {
  concernId: Id
  preview: string
  comfortType: ComfortType
  status: ConcernStatus
  maturesAt: IsoDateTime
  /** 개봉 전이면 null */
  openedAt: IsoDateTime | null
  createdAt: IsoDateTime
}

export type MyConcernListResponse = Paged<MyConcernItem>

/** 치즈 개봉(POST .../open)과 받은 위로 목록 조회(GET .../replies)의 공통 응답 data */
export interface ConcernRepliesResponse {
  concernId: Id
  status: 'OPENED' | 'SAVED'
  /** 최초 개봉 시각 */
  openedAt: IsoDateTime
  /** 작성 시각 오름차순 */
  replies: Reply[]
}

export type OpenConcernResponse = ConcernRepliesResponse

export interface SaveConcernResponse {
  concernId: Id
  status: 'SAVED'
  savedAt: IsoDateTime
}

export interface UnsaveConcernResponse {
  concernId: Id
  status: 'OPENED'
  savedAt: null
}

/** 치즈 보관함 목록 쿼리 (size 기본 20, 1~50) */
export type SavedConcernListParams = PageParams

export interface SavedConcernItem {
  concernId: Id
  preview: string
  comfortType: ComfortType
  /** 받은 위로 수 (기본 위로 포함) */
  replyCount: number
  savedAt: IsoDateTime
}

export type SavedConcernListResponse = Paged<SavedConcernItem>
