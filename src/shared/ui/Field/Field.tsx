import type { ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Field.module.css'

export interface FieldProps {
  /** 입력 요소의 id. label 연결과 설명 문구 id(`${id}-hint`)에 쓴다 */
  id: string
  label: ReactNode
  /** 라벨을 화면에서만 숨긴다(스크린리더는 읽는다) */
  hideLabel?: boolean
  /** 보조 설명 */
  hint?: ReactNode
  /** 오류 문구. 있으면 hint 대신 이 문구를 보여준다 */
  error?: ReactNode
  className?: string
  children: ReactNode
}

/** TextField / TextArea / Select 가 함께 쓰는 라벨 + 설명 래퍼 */
export function Field({ id, label, hideLabel = false, hint, error, className, children }: FieldProps) {
  const message = error || hint

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className={cx(styles.label, hideLabel && styles.srOnly)}>
        {label}
      </label>
      {children}
      {message && (
        <p id={`${id}-hint`} className={cx(styles.message, Boolean(error) && styles.error)} role={error ? 'alert' : undefined}>
          {message}
        </p>
      )}
    </div>
  )
}
