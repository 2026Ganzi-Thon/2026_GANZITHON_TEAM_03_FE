import { useState } from 'react'
import { PageIndicator } from '@/shared/ui'
import { chunkPages, getDotWindow } from './carouselPages'
import { usePageScroller } from './usePageScroller'
import { VaultCard, VaultCardSkeleton } from './VaultCard'
import type { MyConcernItem } from './types'
import styles from './VaultCarousel.module.css'

// 임의 결정(확인 필요): 한 페이지 4개 — 시안의 카드 수, 우유 목록(3개)과 같은 좌우 넘김
const CARDS_PER_PAGE = 4

export interface VaultCarouselProps {
  /** 로딩 중이면 카드 자리만 스켈레톤으로 보인다 */
  loading?: boolean
  items: MyConcernItem[]
}

/** 치즈 보관함: 내가 쓴 고민 카드를 4개씩 좌우 페이지로 넘겨 보는 목록(scroll-snap)과 페이지 점. 우유 목록과 같은 방식. */
export function VaultCarousel({ loading, items }: VaultCarouselProps) {
  // 상세로 갔다 돌아오는 흐름이 없어 현재 페이지는 이 안에서만 기억한다
  const [page, setPage] = useState(0)
  const pages = chunkPages(items, CARDS_PER_PAGE)
  const pageCount = Math.max(pages.length, 1)
  const { scrollerRef, safePage, handleScroll } = usePageScroller({ page, pageCount, onPageChange: setPage, resetKey: loading })
  const dots = getDotWindow(pageCount, safePage)

  return (
    <>
      <div className={styles.viewport}>
        {loading ? (
          <ul className={styles.page} role="status" aria-label="고민을 불러오는 중">
            {Array.from({ length: CARDS_PER_PAGE }, (_, index) => (
              <VaultCardSkeleton key={index} />
            ))}
          </ul>
        ) : (
          <ul ref={scrollerRef} className={styles.scroller} onScroll={handleScroll}>
            {pages.map((cards, pageIndex) => (
              <li key={pageIndex} className={styles.slide} aria-label={`${pageCount}페이지 중 ${pageIndex + 1}페이지`}>
                <ul className={styles.page}>
                  {cards.map((concern) => (
                    <VaultCard key={concern.concernId} concern={concern} />
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
