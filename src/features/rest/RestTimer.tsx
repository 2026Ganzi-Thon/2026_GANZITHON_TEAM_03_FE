import { formatRestTime } from './useRestCountdown'
import styles from './RestTimer.module.css'

export interface RestTimerProps {
  /** 남은 초. 아직 모르면 undefined(자리만 보인다) */
  remainingSeconds: number | undefined
}

/** 진행 중 화면의 남은 시간 알약(시안 64:1304, `mm : ss`). 매초 바뀌므로 화면 낭독기에는 따로 알리지 않는다(role="timer"). */
export function RestTimer({ remainingSeconds }: RestTimerProps) {
  const known = remainingSeconds !== undefined
  return (
    <p
      className={styles.pill}
      role="timer"
      aria-busy={!known || undefined}
      aria-label={known ? `남은 시간 ${Math.floor(remainingSeconds / 60)}분 ${remainingSeconds % 60}초` : '남은 시간'}
    >
      {known ? formatRestTime(remainingSeconds) : '-- : --'}
    </p>
  )
}
