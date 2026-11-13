import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import { Icon } from '@/shared/ui/Icon'
import type { IconName } from '@/shared/ui/Icon'
import styles from './ActionCard.module.css'

export interface ActionCardProps extends Omit<ComponentPropsWithoutRef<'button'>, 'title'> {
  /** filled: 초록 바탕 / outline: 테두리만 */
  variant?: 'filled' | 'outline'
  icon: IconName
  title: ReactNode
  description?: ReactNode
}

/** 아이콘 + 제목 + 설명이 세로로 놓인 큰 이동 버튼 카드 (홈의 "내 기록, 보관함" 등). */
export const ActionCard = forwardRef<HTMLButtonElement, ActionCardProps>(function ActionCard(
  { variant = 'filled', icon, title, description, type = 'button', className, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx(styles.card, styles[variant], className)} {...rest}>
      <Icon name={icon} size={36} />
      <span className={styles.title}>{title}</span>
      {description && <span className={styles.description}>{description}</span>}
    </button>
  )
})
