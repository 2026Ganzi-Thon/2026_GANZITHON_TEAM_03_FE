import { TextField } from '@/shared/ui'
import styles from './MemoField.module.css'

/** 메모 최대 글자 수. 명세 제안값(`docs/api/emotion.md`)이라 확정되면 바뀔 수 있다. */
export const MEMO_MAX_LENGTH = 1000

/** 남은 글자 수를 보여주기 시작하는 길이 */
const COUNTER_FROM = 900

export interface MemoFieldProps {
  value: string
  onChange: (value: string) => void
}

/** "지푸라기 쓰기" 밑줄 입력. 최대 1,000자까지만 입력되고, 900자부터 남은 글자 수를 보여준다. */
export function MemoField({ value, onChange }: MemoFieldProps) {
  return (
    <div className={styles.root}>
      <TextField
        label="지푸라기 쓰기"
        placeholder="간단한 메모를 작성해주세요. (최대 1,000자)"
        value={value}
        maxLength={MEMO_MAX_LENGTH}
        onChange={(event) => onChange(event.target.value)}
      />
      {value.length >= COUNTER_FROM && (
        <p className={styles.counter} aria-live="polite">
          {MEMO_MAX_LENGTH - value.length}자 남음
        </p>
      )}
    </div>
  )
}
