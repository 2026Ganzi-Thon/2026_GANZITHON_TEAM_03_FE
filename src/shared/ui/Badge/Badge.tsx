import type { ComponentPropsWithoutRef } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Badge.module.css'

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  /** accent: 금색(수집 전 등) / primary: 초록 */
  tone?: 'accent' | 'primary'
}

/** 상태를 알려주는 작은 알약 라벨. 누를 수 없다. */
export function Badge({ tone = 'accent', className, ...rest }: BadgeProps) {
  return <span className={cx(styles.badge, styles[tone], className)} {...rest} />
}
