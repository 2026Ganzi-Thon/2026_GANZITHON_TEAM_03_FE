import { Checkbox } from '@/shared/ui'
import milkBottleImage from '@/assets/images/milk-bottle.webp'
import { cx } from '@/shared/lib/cx'
import { concernBody, toPreviewBody } from './concernText'
import type { ConcernCard } from './types'
import styles from './MilkCard.module.css'

export interface MilkCardProps {
  concern: ConcernCard
  selected: boolean
  onSelect: (selected: boolean) => void
  /** "…더보기" — 그 고민의 상세로 */
  onOpen: () => void
}

/** 우유병 카드: 원형 체크로 고르고, 제목과 본문 미리보기 3줄 + "…더보기". 선택하면 배경이 들어간다. */
export function MilkCard({ concern, selected, onSelect, onOpen }: MilkCardProps) {
  const { title } = concern
  const preview = toPreviewBody(concernBody(title, concern.preview))

  return (
    <li className={cx(styles.card, selected && styles.selected)}>
      <Checkbox
        shape="round"
        aria-label={`${title} 선택`}
        checked={selected}
        onChange={(event) => onSelect(event.target.checked)}
      />
      <img src={milkBottleImage} alt="" width={71} height={110} className={styles.bottle} />
      <div className={styles.text}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.bodyWrap}>
          {preview && <p className={styles.body}>{preview}</p>}
          <button type="button" className={cx(styles.more, preview && styles.moreInline)} onClick={onOpen}>
            …더보기
          </button>
        </div>
      </div>
    </li>
  )
}

/** 로딩 자리: 카드와 같은 높이에 우유병·제목·본문 막대만 회색으로 */
export function MilkCardSkeleton() {
  return (
    <li className={cx(styles.card, styles.skeletonCard)} aria-hidden="true">
      <span className={styles.skeletonCheck} />
      <img src={milkBottleImage} alt="" width={71} height={110} className={styles.bottle} />
      <div className={styles.text}>
        <span className={cx(styles.bar, styles.barTitle)} />
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={cx(styles.bar, styles.barShort)} />
      </div>
    </li>
  )
}
