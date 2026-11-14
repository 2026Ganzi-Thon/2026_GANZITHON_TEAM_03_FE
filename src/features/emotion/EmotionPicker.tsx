import { Chip } from '@/shared/ui'
import type { Emotion } from './types'
import styles from './EmotionPicker.module.css'

export interface EmotionPickerProps {
  emotions: Emotion[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
}

/** 감정 칩 목록. 여러 개를 켜고 끌 수 있다(API `emotionIds` 가 배열). */
// 임의 결정(확인 필요): Figma 의 "직접 입력하기" 칩은 1차에서 숨김 — API 에 사용자 정의 감정이 없음(백엔드 요청 대상)
export function EmotionPicker({ emotions, selectedIds, onChange }: EmotionPickerProps) {
  const toggle = (emotionId: string) => {
    onChange(
      selectedIds.includes(emotionId) ? selectedIds.filter((id) => id !== emotionId) : [...selectedIds, emotionId],
    )
  }

  return (
    <div className={styles.root}>
      <p id="emotion-picker-label" className={styles.label}>
        내 감정을 선택해주세요.
      </p>
      <div className={styles.chips} role="group" aria-labelledby="emotion-picker-label">
        {emotions.map((emotion) => (
          <Chip key={emotion.emotionId} selected={selectedIds.includes(emotion.emotionId)} onClick={() => toggle(emotion.emotionId)}>
            {emotion.name}
          </Chip>
        ))}
      </div>
    </div>
  )
}
