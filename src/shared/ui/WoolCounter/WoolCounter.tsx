import type { ComponentPropsWithoutRef } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './WoolCounter.module.css'

export interface WoolCounterProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  /** 보유한 양털 개수. `loading` 이면 쓰지 않는다 */
  count?: number
  /** 앞쪽 글자. 기본 "내 양털" */
  label?: string
  /** 개수를 아직 모를 때 숫자 자리에 회색 막대를 보여준다 */
  loading?: boolean
}

/** 거의 모든 화면 오른쪽 위에 나오는 "내 양털 47개" 알약. */
export function WoolCounter({ count, label = '내 양털', loading = false, className, ...rest }: WoolCounterProps) {
  return (
    <span className={cx(styles.root, className)} aria-busy={loading || undefined} {...rest}>
      <span>{label}</span>
      <span className={styles.count}>
        {loading ? <span className={styles.skeleton} aria-hidden="true" /> : `${count ?? 0}개`}
      </span>
    </span>
  )
}
