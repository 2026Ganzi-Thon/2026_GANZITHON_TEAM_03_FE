import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Toggle.module.css'

export type ToggleProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'size' | 'role'>

/**
 * 켬/끔 스위치(시안 290:984, 52×29). 네이티브 checkbox 에 `role="switch"` 를 붙여 스크린리더는 "스위치, 켬/끔"으로 읽고
 * (켬/끔 상태는 checked 로 전해진다), 스페이스로 바꾼다. 글자는 children 으로 넘기면 왼쪽에 놓이고 클릭 영역에 포함된다.
 * children 이 없으면 `aria-label` 을 직접 넘겨야 한다. className 은 바깥 label 에 붙는다.
 */
export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { className, children, disabled, ...rest },
  ref,
) {
  return (
    <label className={cx(styles.root, disabled && styles.disabled, className)}>
      {children && <span className={styles.label}>{children}</span>}
      <input ref={ref} type="checkbox" role="switch" className={styles.input} disabled={disabled} {...rest} />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
    </label>
  )
})
