import { useEffect, useState } from 'react'
import { fetchHomeSummary } from './homeApi'
import type { HomeSummary } from './homeApi'

export type HomeSummaryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: HomeSummary }

/** 홈 요약을 불러온다. 실패하면 `retry` 로 다시 시도한다. */
export function useHomeSummary() {
  const [state, setState] = useState<HomeSummaryState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetchHomeSummary().then(
      (data) => {
        if (!cancelled) setState({ status: 'success', data })
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
