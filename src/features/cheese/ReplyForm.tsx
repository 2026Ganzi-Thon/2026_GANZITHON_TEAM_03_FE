import { useState } from 'react'
import { containsProfanity } from '@/shared/lib/profanity'
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

const PROFANITY_MESSAGE = '다른 폴리가 상처받을 수 있는 표현이 있어요. 조금만 다듬어 주세요.'

/**
 * "치즈 만들기" 구분선 + 테두리형 입력 + 오른쪽 `위로 남기기` 버튼. 내용이 비면 버튼이 비활성이다.
 * 제출할 때만 비속어를 검사해 걸리면 보내지 않고 안내를 띄운다(입력 중 검사·걸린 단어 표시는 하지 않음). 고치면 안내가 사라진다.
 */
export function ReplyForm({ disabled, submitting, notice, onSubmit }: ReplyFormProps) {
  const [content, setContent] = useState('')
  const [checking, setChecking] = useState(false)
  const [profane, setProfane] = useState(false)
  const canSubmit = content.trim() !== '' && !disabled && !submitting && !checking

  const handleSubmit = async () => {
    setChecking(true)
    try {
      if (await containsProfanity(content)) {
        setProfane(true)
        return
      }
    } catch {
      // 검사 모듈을 못 불러오면(오프라인 등) 막지 않는다 — 서버 검열에 맡긴다
    } finally {
      setChecking(false)
    }
    onSubmit(content)
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) void handleSubmit()
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
        error={profane ? PROFANITY_MESSAGE : undefined}
        onChange={(event) => {
          setContent(event.target.value)
          setProfane(false)
        }}
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
