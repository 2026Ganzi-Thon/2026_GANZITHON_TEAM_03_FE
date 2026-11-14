import { useState } from 'react'
import {
  EMOTIONS,
  EmotionHeader,
  EmotionPicker,
  FeedingAnimation,
  MemoField,
  useCreateEmotionRecord,
} from '@/features/emotion'
import { BackButton, Button } from '@/shared/ui'
import styles from './EmotionWritePage.module.css'

export interface EmotionWritePageProps {
  woolCount: number
  onBack?: () => void
  /** 저장하고 먹이 주기 연출까지 끝났을 때 */
  onFed?: () => void
  onOpenGuide?: () => void
}

/** "오늘의 먹이주기": 감정(복수 선택)과 메모를 입력하고 먹이를 준다. */
export default function EmotionWritePage({ woolCount, onBack, onFed, onOpenGuide }: EmotionWritePageProps) {
  const { state: createState, submit } = useCreateEmotionRecord()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [memo, setMemo] = useState('')

  // 감정을 하나도 고르지 않으면 먹이를 줄 수 없다
  const canSubmit =
    selectedIds.length > 0 && createState.status !== 'submitting' && createState.status !== 'already-exists'

  if (createState.status === 'success') {
    return <FeedingAnimation onDone={() => onFed?.()} />
  }

  return (
    <main className={styles.page}>
      <EmotionHeader woolCount={woolCount} onOpenGuide={onOpenGuide} />
      <div className={styles.body}>
        <BackButton className={styles.back} onClick={onBack} />

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault()
            if (canSubmit) void submit({ emotionIds: selectedIds, memo })
          }}
        >
          <EmotionPicker emotions={EMOTIONS} selectedIds={selectedIds} onChange={setSelectedIds} />

          <MemoField value={memo} onChange={setMemo} />

          {createState.status === 'already-exists' && (
            <p className={styles.notice} role="alert">
              오늘 먹이를 줬어요. 내일 다시 만나요!
            </p>
          )}
          {createState.status === 'error' && (
            <p className={styles.notice} role="alert">
              저장하지 못했어요. 잠시 후 다시 시도해 주세요.
            </p>
          )}

          <Button type="submit" className={styles.submit} disabled={!canSubmit}>
            먹이주기
          </Button>
        </form>
      </div>
    </main>
  )
}
