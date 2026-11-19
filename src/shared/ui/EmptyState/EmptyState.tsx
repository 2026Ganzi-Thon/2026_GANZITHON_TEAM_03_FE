import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  /** 가운데 그림(양 등). 장식이라 화면 읽기에서는 건너뛴다 */
  image: string
  title: ReactNode
  description?: ReactNode
  /** 아래 버튼 등 */
  action?: ReactNode
  className?: string
}

/** 빈 목록 안내: 둥근 바탕 위 그림 → 제목 → 설명 → 버튼. 나타날 때 살짝 떠오르고, 그림은 천천히 숨 쉬듯 움직인다. */
export default function EmptyState({ image, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={styles.art} aria-hidden="true">
        <img className={styles.image} src={image} alt="" draggable={false} />
      </div>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
