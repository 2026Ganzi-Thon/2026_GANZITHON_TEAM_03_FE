import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import { Field } from '@/shared/ui/Field'
import styles from './TextArea.module.css'

export interface TextAreaProps extends ComponentPropsWithoutRef<'textarea'> {
  label: ReactNode
  hideLabel?: boolean
  hint?: ReactNode
  error?: ReactNode
}

/** 테두리형 여러 줄 입력창. className 은 바깥 래퍼에 붙고, 나머지 속성은 textarea 로 간다. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hideLabel, hint, error, id: idProp, className, rows = 2, ...rest },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId

  return (
    <Field id={id} label={label} hideLabel={hideLabel} hint={hint} error={error} className={className}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={cx(styles.textarea, Boolean(error) && styles.invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-hint` : undefined}
        {...rest}
      />
    </Field>
  )
})
