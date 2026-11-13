import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Chip.module.css'

export interface ChipProps extends ComponentPropsWithoutRef<'button'> {
  /** 선택된 상태. 켜고 끄는 칩(감정 선택, 카테고리 필터)에 쓴다 */
  selected?: boolean
}

/** 알약 모양의 선택 칩. 켜고 끄는 버튼이라 aria-pressed 를 자동으로 붙인다. */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected = false, type = 'button', className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cx(styles.chip, selected && styles.selected, className)}
      {...rest}
    >
      {children}
    </button>
  )
})
