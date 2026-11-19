import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { cx } from '@/shared/lib/cx'
import { Icon } from '@/shared/ui/Icon'
import styles from './Banner.module.css'

export type BannerProps = ComponentPropsWithoutRef<'button'>

/**
 * 베이지 바탕의 한 줄 안내. 누를 곳(onClick)이 있으면 버튼이 되고 오른쪽 `>` 로 이동한다는 것을 보여준다.
 * onClick 이 없으면 글자만 있는 안내(누를 수 없음, `>` 없음)로 그린다.
 */
export const Banner = forwardRef<HTMLButtonElement, BannerProps>(function Banner(
  { type = 'button', className, children, ...rest },
  ref,
) {
  if (!rest.onClick) {
    return (
      <p className={cx(styles.banner, styles.static, className)}>
        <span className={styles.text}>{children}</span>
      </p>
    )
  }
  return (
    <button ref={ref} type={type} className={cx(styles.banner, className)} {...rest}>
      <span className={styles.text}>{children}</span>
      <Icon name="chevron-right" size={7} />
    </button>
  )
})
