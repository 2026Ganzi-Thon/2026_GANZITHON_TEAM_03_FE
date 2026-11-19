import type { CareAction } from './types'

// 돌봄 행동 분류. 서버 응답의 `category`(백엔드 V13 care_actions.category, 기본값 '기타')를 그대로 탭으로 쓴다.
// 값은 움직이기·마음돌봄·쉬어가기·일상가꾸기(V14 기본 행동 16개)와, 그 밖의 행동은 기타 — docs/api/care-wool.md.

/** 탭 id = 서버 분류 이름 그대로 */
export type CareCategoryId = string

export interface CareCategory {
  id: CareCategoryId
  label: string
}

/** 시안(4 양털 모으기)의 탭 순서. 비어 있어도 늘 보인다 */
const BASE_LABELS = ['움직이기', '마음돌봄', '쉬어가기', '일상가꾸기'] as const

/** 서버 기본값. 분류가 비었거나 없으면 이 탭으로 */
const ETC_LABEL = '기타'

const toCategory = (label: string): CareCategory => ({ id: label, label })

const BASE_CATEGORIES: CareCategory[] = BASE_LABELS.map(toCategory)

export function categoryOf(action: CareAction): CareCategoryId {
  return action.category?.trim() || ETC_LABEL
}

export interface CareGroups {
  /** 보여줄 탭 */
  categories: CareCategory[]
  /** 탭별 행동(서버 순서 그대로). 없는 탭은 빈 배열 */
  byCategory: (id: CareCategoryId) => CareAction[]
}

/**
 * 서버 목록을 탭으로 나눈다. 기본 4개 탭은 비어 있어도 시안대로 늘 보이고, 그 밖의 분류는 서버 순서대로 뒤에 붙인다("기타"는 맨 뒤).
 * 기본 4개 분류의 행동이 하나도 없으면(예: 수동으로 넣은 행동만 '기타') 빈 탭 4개 대신 있는 분류만 탭으로 보여준다
 * — 탭 줄 자체는 남겨 데이터가 와도 목록·버튼 자리가 그대로다.
 */
export function groupCareActions(actions: CareAction[]): CareGroups {
  const map = new Map<CareCategoryId, CareAction[]>()
  for (const action of actions) {
    const id = categoryOf(action)
    const list = map.get(id)
    if (list) list.push(action)
    else map.set(id, [action])
  }
  const extras = [...map.keys()]
    .filter((id) => !(BASE_LABELS as readonly string[]).includes(id))
    .sort((a, b) => Number(a === ETC_LABEL) - Number(b === ETC_LABEL))
    .map(toCategory)
  const hasBase = BASE_LABELS.some((label) => map.has(label))
  return {
    categories: hasBase || extras.length === 0 ? [...BASE_CATEGORIES, ...extras] : extras,
    byCategory: (id) => map.get(id) ?? [],
  }
}

/** 로딩 중 스켈레톤에 그릴 기본 탭 */
export const SKELETON_CATEGORIES = BASE_CATEGORIES
