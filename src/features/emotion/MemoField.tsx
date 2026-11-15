import { useId, useLayoutEffect, useRef } from 'react'
import { Field } from '@/shared/ui'
import styles from './MemoField.module.css'

/** 메모 최대 글자 수. 명세 제안값(`docs/api/emotion.md`)이라 확정되면 바뀔 수 있다. */
export const MEMO_MAX_LENGTH = 1000

/** 남은 글자 수를 보여주기 시작하는 길이 */
const COUNTER_FROM = 900

export interface MemoFieldProps {
  value: string
  onChange: (value: string) => void
}

/**
 * "지푸라기 쓰기" 밑줄 입력. 줄바꿈(Enter)이 되고, 줄이 늘면 입력창이 같이 커진다(너무 길면 안에서 스크롤).
 * 최대 1,000자까지만 입력되고, 900자부터 남은 글자 수를 보여준다.
 */
export function MemoField({ value, onChange }: MemoFieldProps) {
  const id = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 내용에 맞춰 높이를 늘린다. 먼저 줄여야 글을 지울 때도 같이 줄어든다.
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  return (
    <div className={styles.root}>
      <Field id={id} label="지푸라기 쓰기">
        <textarea
          ref={textareaRef}
          id={id}
          className={styles.textarea}
          rows={1}
          placeholder="간단한 메모를 작성해주세요. (최대 1,000자)"
          value={value}
          maxLength={MEMO_MAX_LENGTH}
          onChange={(event) => onChange(event.target.value)}
        />
      </Field>
      {value.length >= COUNTER_FROM && (
        <p className={styles.counter} aria-live="polite">
          {MEMO_MAX_LENGTH - value.length}자 남음
        </p>
      )}
    </div>
  )
}
