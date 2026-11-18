import milkBottleImage from '@/assets/images/milk-bottle.webp'
import { cx } from '@/shared/lib/cx'
import { splitConcernText, toPreviewBody } from './concernText'
import type { MyConcernItem } from './types'
import styles from './VaultCard.module.css'

export interface VaultCardProps {
  concern: MyConcernItem
  /** "더보기" — 그 고민의 상세(받은 위로)로 */
  onOpen: () => void
}

/**
 * 치즈 보관함 카드: 우유병 + 제목(본문 첫 줄) + 본문 2줄 + "더보기".
 * 카드 자체는 누를 수 없고 "더보기"만 상세로 간다(우유 목록과 같음). 본문이 짧아도 "더보기"는 늘 보인다 — 상세로 가는 유일한 길.
 * 임의 결정(확인 필요): 상태(숙성 중·숙성 끝·개봉·보관)별 그림·표시 구분 없음 — 시안이 모두 같은 우유병
 */
export function VaultCard({ concern, onOpen }: VaultCardProps) {
  const { title, body } = splitConcernText(concern.preview)
  const preview = toPreviewBody(body)

  return (
    <li className={styles.card}>
      <img src={milkBottleImage} alt="" width={71} height={110} className={styles.bottle} />
      <div className={styles.text}>
        <h3 className={styles.title}>{title}</h3>
        {preview && <p className={styles.body}>{preview}</p>}
        <button type="button" className={styles.more} aria-label={`${title} 더보기`} onClick={onOpen}>
          더보기
        </button>
      </div>
    </li>
  )
}

/** 로딩 자리: 카드와 같은 높이에 우유병·제목·본문 막대만 회색으로 */
export function VaultCardSkeleton() {
  return (
    <li className={cx(styles.card, styles.skeleton)} aria-hidden="true">
      <img src={milkBottleImage} alt="" width={71} height={110} className={styles.bottle} />
      <div className={styles.text}>
        <span className={cx(styles.bar, styles.barTitle)} />
        <span className={styles.bar} />
        <span className={cx(styles.bar, styles.barShort)} />
      </div>
    </li>
  )
}
