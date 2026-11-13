import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import { Field } from '@/shared/ui/Field'
import styles from './TextField.module.css'

export interface TextFieldProps extends Omit<ComponentPropsWithoutRef<'input'>, 'size'> {
  label: ReactNode
  hideLabel?: boolean
  /** 입력 아래 보조 설명 (예: 비밀번호 규칙) */
  hint?: ReactNode
  /** 오류 문구. 있으면 빨간 밑줄과 함께 보여준다 */
  error?: ReactNode
  /** 입력창 오른쪽에 붙이는 요소 (예: 중복확인 버튼) */
  endAdornment?: ReactNode
}

/** 밑줄형 입력창. className 은 바깥 래퍼에 붙고, 나머지 속성은 input 으로 간다. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hideLabel, hint, error, endAdornment, id: idProp, className, type = 'text', ...rest },
  ref,
) {
  const autoId = useId()
  const id = idProp ?? autoId

  return (
    <Field id={id} label={label} hideLabel={hideLabel} hint={hint} error={error} className={className}>
      <div className={cx(styles.control, Boolean(error) && styles.invalid)}>
        <input
          ref={ref}
          id={id}
          type={type}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint || error ? `${id}-hint` : undefined}
          {...rest}
        />
        {endAdornment}
      </div>
    </Field>
  )
})
