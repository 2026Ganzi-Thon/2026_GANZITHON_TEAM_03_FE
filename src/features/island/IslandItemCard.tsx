import { Icon } from '@/shared/ui'
import type { IslandItem } from './types'
import styles from './IslandItemCard.module.css'

export interface IslandItemCardProps {
  item: IslandItem
  onSelect: (item: IslandItem) => void
}

/**
 * 아이템 카드(시안 109:280, 170×213): 그림, 이름, 구름 + 양털 값.
 * 임의 결정(확인 필요): 산 아이템은 값 자리에 체크 + "보유"(초록)를 보이고 누를 수 없게 한다 — 시안 없음
 */
export function IslandItemCard({ item, onSelect }: IslandItemCardProps) {
  return (
    <button
      type="button"
      className={styles.card}
      disabled={item.owned}
      aria-label={item.owned ? `${item.name}, 보유` : `${item.name}, 양털 ${item.price}개`}
      onClick={() => onSelect(item)}
    >
      <span className={styles.image}>
        {item.imageUrl && <img src={item.imageUrl} width={121} height={121} alt="" loading="lazy" decoding="async" />}
      </span>
      <span className={styles.name}>{item.name}</span>
      {item.owned ? (
        <span className={`${styles.price} ${styles.owned}`}>
          <Icon name="check" size={20} />
          보유
        </span>
      ) : (
        <span className={styles.price}>
          <Icon name="cloud" size={24} />
          {item.price}
        </span>
      )}
    </button>
  )
}

/** 불러오는 동안 카드 자리. 실제 카드와 같은 크기라 목록이 들어와도 레이아웃이 안 튄다 */
export function IslandItemCardSkeleton() {
  return (
    <span className={`${styles.card} ${styles.skeleton}`} aria-hidden="true">
      <span className={styles.image}>
        <span className={styles.skeletonImage} />
      </span>
      <span className={styles.name}>
        <span className={styles.skeletonBar} />
      </span>
      <span className={styles.price} />
    </span>
  )
}
