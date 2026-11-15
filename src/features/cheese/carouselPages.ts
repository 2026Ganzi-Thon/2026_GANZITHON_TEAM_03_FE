import type { ConcernCard } from './types'

/** 한 페이지에 보여주는 카드 수 */
export const CARDS_PER_PAGE = 3
/** 페이지 점은 최대 5개까지만 보여준다(그 이상이면 현재 위치를 기준으로 창처럼 움직인다) */
const MAX_DOTS = 5

/** 페이지 수와 현재 페이지로 보여줄 점 개수·현재 점 위치를 구한다. */
export function getDotWindow(pageCount: number, page: number): { count: number; current: number } {
  const count = Math.min(pageCount, MAX_DOTS)
  const start = Math.min(Math.max(page - Math.floor(MAX_DOTS / 2), 0), pageCount - count)
  return { count, current: page - start }
}

export function chunkConcerns(items: ConcernCard[]): ConcernCard[][] {
  const pages: ConcernCard[][] = []
  for (let index = 0; index < items.length; index += CARDS_PER_PAGE) {
    pages.push(items.slice(index, index + CARDS_PER_PAGE))
  }
  return pages
}
