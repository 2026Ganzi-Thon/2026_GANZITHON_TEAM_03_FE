import type { IslandCategoryFilter } from './types'

/** 분류 칩. 이름은 시안(102:744) 그대로, 순서도 시안 순서 */
export const ISLAND_CATEGORIES: ReadonlyArray<{ value: IslandCategoryFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'PLANT', label: '식물' },
  { value: 'PATH', label: '길과 바닥' },
  { value: 'FURNITURE', label: '가구' },
  { value: 'LIGHT', label: '조명' },
  { value: 'PROP', label: '소품' },
]
