import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import { Field } from '@/shared/ui/Field'
import { Icon } from '@/shared/ui/Icon'
import styles from './Select.module.css'

export interface SelectProps extends Omit<ComponentPropsWithoutRef<'select'>, 'size'> {
  label: ReactNode
  hideLabel?: boolean
  hint?: ReactNode
  error?: ReactNode
}

/** 네이티브 select 를 꾸민 선택창. 선택지는 `<option>` 을 children 으로 넘긴다. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hideLabel, hint, error, id: idProp, className, children, ...rest },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId

  return (
    <Field id={id} label={label} hideLabel={hideLabel} hint={hint} error={error} className={className}>
      <div className={styles.wrapper}>
        <select
          ref={ref}
          id={id}
          className={cx(styles.select, Boolean(error) && styles.invalid)}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? `${id}-hint` : undefined}
          {...rest}
        >
          {children}
        </select>
        <Icon name="chevron-down" size={9} className={styles.chevron} />
      </div>
    </Field>
  )
})
