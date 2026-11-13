import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { cx } from '@/shared/lib/cx'
import { Icon } from '@/shared/ui/Icon'
import type { IconName } from '@/shared/ui/Icon'
import styles from './IconButton.module.css'

export interface IconButtonProps
  extends Omit<ComponentPropsWithoutRef<'button'>, 'children' | 'aria-label'> {
  icon: IconName
  /** 아이콘만 있는 버튼이라 이름이 꼭 필요하다 */
  'aria-label': string
  /** 아이콘 크기(px). 기본 24 */
  iconSize?: number
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, iconSize = 24, type = 'button', className, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx(styles.button, className)} {...rest}>
      <Icon name={icon} size={iconSize} />
    </button>
  )
})
