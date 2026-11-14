import { useEffect, useState } from 'react'
import { fetchEmotionRecords } from './emotionApi'
import type { EmotionRecordsState } from './types'

/** 최근 감정 기록을 불러온다. 실패하면 `retry` 로 다시 시도한다. */
export function useEmotionRecords() {
  const [state, setState] = useState<EmotionRecordsState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchEmotionRecords().then(
      ({ items, hasNext }) => {
        if (!cancelled) setState({ status: 'success', records: items, hasNext })
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
