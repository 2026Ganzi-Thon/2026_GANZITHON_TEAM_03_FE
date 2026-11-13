import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Button.module.css'

export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  /** primary: 기본 CTA / accent: 보조 강조(섬 꾸미기 등) / outline: 테두리만 / ghost: 글자만(건너뛰기 등) */
  variant?: 'primary' | 'accent' | 'outline' | 'ghost'
  /** lg: 화면 하단 CTA(46px) / md: 일반(38px) / sm: 입력창 옆 작은 버튼(35px) */
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  /** 글자 왼쪽에 놓는 아이콘 */
  leftIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, leftIcon, type = 'button', className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        !!leftIcon && styles.withIcon,
        className,
      )}
      {...rest}
    >
      {leftIcon && (
        <span className={styles.icon} aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children}
    </button>
  )
})
