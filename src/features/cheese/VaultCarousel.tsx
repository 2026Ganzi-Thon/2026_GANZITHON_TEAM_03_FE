import { PageIndicator } from '@/shared/ui'
import { chunkPages, getDotWindow } from './carouselPages'
import { usePageScroller } from './usePageScroller'
import { VaultCard, VaultCardSkeleton } from './VaultCard'
import type { VaultCardItem } from './vaultCards'
import styles from './VaultCarousel.module.css'

// 임의 결정(확인 필요): 한 페이지 4개 — 시안의 카드 수, 우유 목록(3개)과 같은 좌우 넘김
const CARDS_PER_PAGE = 4

export interface VaultCarouselProps {
  /** 로딩 중이면 카드 자리만 스켈레톤으로 보인다 */
  loading?: boolean
  items: VaultCardItem[]
  /** 현재 페이지(0부터). 상세에 다녀와도 유지되도록 쓰는 쪽이 들고 있다 */
  page: number
  onPageChange: (page: number) => void
  /** 카드의 "더보기" — 그 고민의 상세로 */
  onOpen: (concernId: string) => void
  /** 사용법 안내 중 — 첫 카드의 상태 글자와 "더보기"를 안내가 가리킬 수 있게 표시한다 */
  guideTargets?: boolean
}

/** 치즈 보관함: 내 고민·보관한 치즈 카드를 4개씩 좌우 페이지로 넘겨 보는 목록(scroll-snap)과 페이지 점. 우유 목록과 같은 방식. */
export function VaultCarousel({ loading, items, page, onPageChange, onOpen, guideTargets = false }: VaultCarouselProps) {
  const pages = chunkPages(items, CARDS_PER_PAGE)
  const pageCount = Math.max(pages.length, 1)
  const { scrollerRef, safePage, handleScroll } = usePageScroller({ page, pageCount, onPageChange, resetKey: loading })
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
                  {cards.map((concern, index) => (
                    <VaultCard
                      key={concern.concernId}
                      concern={concern}
                      onOpen={() => onOpen(concern.concernId)}
                      guideTargets={guideTargets && pageIndex === 0 && index === 0}
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
