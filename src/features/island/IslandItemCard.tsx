import { Icon } from '@/shared/ui'
import type { IslandItem } from './types'
import styles from './IslandItemCard.module.css'

export interface IslandItemCardProps {
  item: IslandItem
  /** 섬에 놓아 보는 중인 카드 */
  selected?: boolean
  onSelect: (item: IslandItem) => void
}

/**
 * 아이템 카드(시안 109:280, 170×213): 그림, 이름, 구름 + 양털 값.
 * 한 번 누르면 선택되어 섬에 놓아 보이고, 선택된 카드를 한 번 더 누르면 구매로 간다(동작은 쓰는 쪽이 정한다).
 * 임의 결정(확인 필요): 산 아이템은 값 자리에 체크 + "보유"(초록)를 보이고 누를 수 없게 한다 — 시안 없음
 * 임의 결정(확인 필요): 선택된 카드는 테두리를 금색으로, 값 상자를 금색으로 채우고 "구매"를 붙인다 — 시안 없음
 */
export function IslandItemCard({ item, selected = false, onSelect }: IslandItemCardProps) {
  return (
    <button
      type="button"
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      disabled={item.owned}
      aria-pressed={item.owned ? undefined : selected}
      aria-label={
        item.owned
          ? `${item.name}, 보유`
          : selected
            ? `${item.name}, 양털 ${item.price}개, 섬에 놓아 보는 중. 한 번 더 누르면 구매`
            : `${item.name}, 양털 ${item.price}개`
      }
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
          {selected && <span className={styles.buy}>구매</span>}
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
