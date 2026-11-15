import { useLayoutEffect, useRef } from 'react'
import { PageIndicator } from '@/shared/ui'
import { MilkCard, MilkCardSkeleton } from './MilkCard'
import { CARDS_PER_PAGE, chunkConcerns, getDotWindow } from './carouselPages'
import type { ConcernCard } from './types'
import styles from './MilkCarousel.module.css'

export interface MilkCarouselProps {
  /** 로딩 중이면 카드 자리만 스켈레톤으로 보인다 */
  loading?: boolean
  items: ConcernCard[]
  /** 현재 페이지(0부터). 상세에 다녀와도 유지되도록 쓰는 쪽이 들고 있다 */
  page: number
  onPageChange: (page: number) => void
  selectedId: string | null
  onSelect: (concernId: string | null) => void
  onOpen: (concernId: string) => void
}

/** 우유병 카드를 3개씩 좌우 페이지로 넘겨 보는 목록(scroll-snap)과 페이지 점. */
export function MilkCarousel({ loading, items, page, onPageChange, selectedId, onSelect, onOpen }: MilkCarouselProps) {
  const scrollerRef = useRef<HTMLUListElement>(null)
  const pages = chunkConcerns(items)
  const pageCount = Math.max(pages.length, 1)
  const safePage = Math.min(page, pageCount - 1)

  // 처음 그릴 때(상세에서 돌아왔을 때 포함) 기억해 둔 페이지 위치로 바로 가 있는다
  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    if (scroller) scroller.scrollLeft = safePage * scroller.clientWidth
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 때 한 번만 맞춘다. 이후는 사용자의 스와이프가 기준
  }, [loading])

  const handleScroll = () => {
    const scroller = scrollerRef.current
    if (!scroller || scroller.clientWidth === 0) return
    const next = Math.round(scroller.scrollLeft / scroller.clientWidth)
    if (next !== safePage && next < pageCount) onPageChange(next)
  }

  const dots = getDotWindow(pageCount, safePage)

  return (
    <>
      <div className={styles.viewport}>
        {loading ? (
          <ul className={styles.page} role="status" aria-label="고민을 불러오는 중">
            {Array.from({ length: CARDS_PER_PAGE }, (_, index) => (
              <MilkCardSkeleton key={index} />
            ))}
          </ul>
        ) : (
          <ul ref={scrollerRef} className={styles.scroller} onScroll={handleScroll}>
            {pages.map((cards, pageIndex) => (
              <li key={pageIndex} className={styles.slide} aria-label={`${pageCount}페이지 중 ${pageIndex + 1}페이지`}>
                <ul className={styles.page}>
                  {cards.map((concern) => (
                    <MilkCard
                      key={concern.concernId}
                      concern={concern}
                      selected={concern.concernId === selectedId}
                      onSelect={(selected) => onSelect(selected ? concern.concernId : null)}
                      onOpen={() => onOpen(concern.concernId)}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
      <PageIndicator className={styles.dots} count={dots.count} current={dots.current} />
    </>
  )
}
