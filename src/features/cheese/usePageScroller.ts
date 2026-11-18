import { useLayoutEffect, useRef } from 'react'

interface PageScrollerOptions {
  /** 현재 페이지(0부터) */
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  /** 이 값이 바뀔 때(스크롤러가 새로 그려질 때) 현재 페이지 위치로 바로 옮긴다 — 로딩이 끝났을 때 등 */
  resetKey: unknown
}

/**
 * 좌우 페이지 목록(scroll-snap)의 스크롤 위치 ↔ 현재 페이지를 잇는다. 우유 목록·치즈 보관함이 같이 쓴다.
 * 슬라이드 하나가 스크롤러 폭 전체를 차지한다고 본다.
 */
export function usePageScroller({ page, pageCount, onPageChange, resetKey }: PageScrollerOptions) {
  const scrollerRef = useRef<HTMLUListElement>(null)
  const safePage = Math.min(page, pageCount - 1)

  // 처음 그릴 때(상세에서 돌아왔을 때 포함) 기억해 둔 페이지 위치로 바로 가 있는다
  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (scroller) scroller.scrollLeft = safePage * scroller.clientWidth
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 때 한 번만 맞춘다. 이후는 사용자의 스와이프가 기준
  }, [resetKey])

  const handleScroll = () => {
    const scroller = scrollerRef.current
    if (!scroller || scroller.clientWidth === 0) return
    const next = Math.round(scroller.scrollLeft / scroller.clientWidth)
    if (next !== safePage && next < pageCount) onPageChange(next)
  }

  return { scrollerRef, safePage, handleScroll }
}
