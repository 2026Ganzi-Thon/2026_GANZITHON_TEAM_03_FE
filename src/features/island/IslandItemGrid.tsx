import { Button } from '@/shared/ui'
import { IslandItemCard, IslandItemCardSkeleton } from './IslandItemCard'
import type { IslandItem } from './types'
import styles from './IslandItemGrid.module.css'

export interface IslandItemGridProps {
  status: 'loading' | 'error' | 'success'
  /** 분류로 거른 아이템 */
  items: IslandItem[]
  onSelect: (item: IslandItem) => void
  onRetry: () => void
}

const SKELETON_COUNT = 4

/** 2열 아이템 카드 목록과 그 로딩·오류·빈 분류 상태. */
export function IslandItemGrid({ status, items, onSelect, onRetry }: IslandItemGridProps) {
  if (status === 'error') {
    return (
      <div className={styles.status} role="alert">
        {/* 임의 결정(확인 필요): 불러오기 실패 문구와 "다시 시도" — 시안 없음 */}
        <p className={styles.message}>아이템을 불러오지 못했어요.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className={styles.grid} aria-busy="true" aria-label="아이템을 불러오는 중">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <IslandItemCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={styles.status}>
        {/* 임의 결정(확인 필요): 빈 분류 안내 문구 — 시안 없음 */}
        <p className={styles.message}>이 분류에는 아직 아이템이 없어요</p>
      </div>
    )
  }

  return (
    <ul className={styles.grid}>
      {items.map((item) => (
        <li key={item.itemId} className={styles.cell}>
          <IslandItemCard item={item} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  )
}
