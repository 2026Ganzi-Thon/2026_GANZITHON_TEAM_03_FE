import { useEffect, useState } from 'react'
import type { RestSession } from './types'

/**
 * 진행 중 세션의 남은 시간(초)을 1초마다 갱신한다. 서버는 부르지 않는다(남은 시간은 scheduledEndAt 과 시각 차이로 계산).
 * 기기 시계를 서버 시계로 맞춘 현재 시각(`Date.now() + serverOffsetMs`) 기준, 올림. 진행 중이 아니면 0.
 * 현재 시각은 state 로 들고 타이머에서만 바꾼다 — 렌더 중 `Date.now()` 는 React Compiler 가 메모해 버려 숫자가 멈춘다.
 * 초가 바뀌는 순간을 놓치지 않게 다음 초 경계에 맞춰 깨운다.
 */
export function useRestCountdown(session: RestSession | null, serverOffsetMs: number): number {
  const running = session?.status === 'RUNNING'
  const endMs = session ? Date.parse(session.scheduledEndAt) : 0
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!running) return
    let timer = 0
    const schedule = () => {
      const left = endMs - (Date.now() + serverOffsetMs)
      // 남은 ms 의 1초 미만 부분이 지나면 표시(올림)가 1 줄어든다. 처음 한 번은 바로 맞춘다(세션이 바뀐 직후)
      timer = window.setTimeout(
        () => {
          setNow(Date.now())
          if (endMs - (Date.now() + serverOffsetMs) > 0) schedule()
        },
        left > 0 ? (left % 1000 || 1000) + 5 : 0,
      )
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [running, endMs, serverOffsetMs])

  return running ? Math.max(0, Math.ceil((endMs - (now + serverOffsetMs)) / 1000)) : 0
}

/** `mm : ss` (시안 표기, 콜론 앞뒤 띄움) */
export function formatRestTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`
}
