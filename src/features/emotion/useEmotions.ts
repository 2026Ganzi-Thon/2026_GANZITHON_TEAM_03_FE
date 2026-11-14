import { useEffect, useState } from 'react'
import { fetchEmotions } from './emotionApi'
import type { Emotion } from './types'

export type EmotionsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; emotions: Emotion[] }

/** 선택할 수 있는 감정 목록을 불러온다. 실패하면 `retry` 로 다시 시도한다. */
export function useEmotions() {
  const [state, setState] = useState<EmotionsState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchEmotions().then(
      (emotions) => {
        if (!cancelled) setState({ status: 'success', emotions })
      },
      () => {
        if (!cancelled) setState({ status: 'error' })
      },
    )

    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = () => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  return { state, retry }
}
