// 고민·위로(cheese) 기능 타입. 근거: docs/api/cheese.md, docs/api/common.md(고민 목록 규칙)
import type { ComfortType, ConcernCard, MyConcernItem, SavedConcernItem } from '@/shared/types'

export type {
  ComfortType,
  ConcernCard,
  ConcernDetail,
  ConcernListResponse,
  ConcernRepliesResponse,
  ConcernStatus,
  CreateConcernRequest,
  CreateConcernResponse,
  CreateReplyRequest,
  CreateReplyResponse,
  MyConcernItem,
  MyConcernListParams,
  MyConcernListResponse,
  OpenConcernResponse,
  Reply,
  SavedConcernItem,
  SavedConcernListParams,
  SavedConcernListResponse,
  SaveConcernResponse,
  UnsaveConcernResponse,
} from '@/shared/types'

/** 고민 쓰기 폼. 위로 방식은 고르기 전에는 비어 있다. */
export interface ConcernFormValues {
  content: string
  comfortType: ComfortType | null
}

export interface ReplyFormValues {
  content: string
}

/**
 * 위로할 고민 목록의 화면 상태. 진입 시 한 번 받은 최대 100개를 그대로 쓰고,
 * 상세에서 돌아오면 같은 목록·순서·스크롤 위치로 복귀한다(재조회·재추첨 없음).
 */
export interface ConcernListSnapshot {
  items: ConcernCard[]
  scrollTop: number
}

export type ConcernListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; snapshot: ConcernListSnapshot }

/** 치즈 보관함 화면의 탭: 내가 쓴 고민 전체(숙성 중·숙성 끝·개봉·보관) / 보관한 치즈만 */
export type CheeseTab = 'mine' | 'saved'

export type MyConcernListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: MyConcernItem[]; hasNext: boolean }

export type SavedConcernListState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: SavedConcernItem[]; hasNext: boolean }
