import type { ComponentPropsWithoutRef } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './PageIndicator.module.css'

export interface PageIndicatorProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** 전체 단계 수 */
  count: number
  /** 현재 단계 (0부터 시작) */
  current: number
}

/** 온보딩·슬라이드의 현재 위치를 점으로 보여준다. 현재 점만 길쭉하다. */
export function PageIndicator({ count, current, className, ...rest }: PageIndicatorProps) {
  return (
    <div
      role="img"
      aria-label={`${count}단계 중 ${current + 1}단계`}
      className={cx(styles.root, className)}
      {...rest}
    >
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={cx(styles.dot, index === current && styles.current)} />
      ))}
    </div>
  )
}
