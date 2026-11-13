import type { ComponentPropsWithoutRef } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './WoolCounter.module.css'

export interface WoolCounterProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** 보유한 양털 개수 */
  count: number
  /** 앞쪽 글자. 기본 "내 양털" */
  label?: string
}

/** 거의 모든 화면 오른쪽 위에 나오는 "내 양털 47개" 알약. */
export function WoolCounter({ count, label = '내 양털', className, ...rest }: WoolCounterProps) {
  return (
    <span className={cx(styles.root, className)} {...rest}>
      <span>{label}</span>
      <span className={styles.count}>{count}개</span>
    </span>
  )
}
