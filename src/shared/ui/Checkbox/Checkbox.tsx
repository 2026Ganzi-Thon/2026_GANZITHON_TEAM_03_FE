import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { cx } from '@/shared/lib/cx'
import { Icon } from '@/shared/ui/Icon'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'size'> {
  /** square: 약관 동의 등 일반 체크 / round: 목록에서 항목을 고를 때 */
  shape?: 'square' | 'round'
}

/**
 * 네이티브 checkbox 를 꾸민 체크박스. 글자는 children 으로 넘기면 클릭 영역에 포함된다.
 * children 이 없으면 `aria-label` 을 직접 넘겨야 한다. className 은 바깥 label 에 붙는다.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { shape = 'square', className, children, disabled, ...rest },
  ref,
) {
  return (
    <label className={cx(styles.root, disabled && styles.disabled, className)}>
      <input ref={ref} type="checkbox" className={styles.input} disabled={disabled} {...rest} />
      <span className={cx(styles.box, styles[shape])} aria-hidden="true">
        <Icon name="check" size={shape === 'round' ? 18 : 15} className={styles.check} />
      </span>
      {children && <span className={styles.label}>{children}</span>}
    </label>
  )
})
