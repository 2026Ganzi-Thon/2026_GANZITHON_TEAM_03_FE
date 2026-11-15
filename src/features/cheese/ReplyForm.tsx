import { useState } from 'react'
import { Button, TextArea } from '@/shared/ui'
import styles from './ReplyForm.module.css'

export interface ReplyFormProps {
  /** 보내는 중이거나 위로할 수 없는 고민이면 입력·버튼을 막는다 */
  disabled?: boolean
  submitting?: boolean
  /** 입력창 아래에 보여줄 안내(오류·마감 등) */
  notice?: string
  onSubmit: (content: string) => void
}

/** "치즈 만들기" 구분선 + 테두리형 입력 + 오른쪽 `위로 남기기` 버튼. 내용이 비면 버튼이 비활성이다. */
export function ReplyForm({ disabled, submitting, notice, onSubmit }: ReplyFormProps) {
  const [content, setContent] = useState('')
  const canSubmit = content.trim() !== '' && !disabled && !submitting

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) onSubmit(content)
      }}
    >
      <div className={styles.divider}>
        <span className={styles.label}>치즈 만들기</span>
        <span className={styles.line} aria-hidden="true" />
      </div>
      <TextArea
        label="위로 남기기"
        hideLabel
        placeholder="고민에 답변을 하고 치즈를 만들어주세요."
        value={content}
        disabled={disabled}
        onChange={(event) => setContent(event.target.value)}
      />
      {notice && (
        <p className={styles.notice} role="alert">
          {notice}
        </p>
      )}
      <Button type="submit" className={styles.submit} disabled={!canSubmit}>
        위로 남기기
      </Button>
    </form>
  )
}
