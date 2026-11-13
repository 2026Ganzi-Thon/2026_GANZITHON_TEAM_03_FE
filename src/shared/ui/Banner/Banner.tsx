import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { cx } from '@/shared/lib/cx'
import { Icon } from '@/shared/ui/Icon'
import styles from './Banner.module.css'

export type BannerProps = ComponentPropsWithoutRef<'button'>

/** 베이지 바탕의 한 줄 안내 버튼. 오른쪽 `>` 로 눌러서 이동한다는 것을 보여준다. */
export const Banner = forwardRef<HTMLButtonElement, BannerProps>(function Banner(
  { type = 'button', className, children, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx(styles.banner, className)} {...rest}>
      <span className={styles.text}>{children}</span>
      <Icon name="chevron-right" size={7} />
    </button>
  )
})
