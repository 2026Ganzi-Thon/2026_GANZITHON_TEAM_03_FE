import { formatRestTime } from './useRestCountdown'
import styles from './RestDimmer.module.css'

export interface RestDimmerProps {
  /** 휴대폰을 눕혀 쉬는 중이면 true — 화면을 서서히 어둡게 덮는다 */
  active: boolean
  /** 남은 초. 어두운 화면에 아주 흐리게 남긴다 */
  remainingSeconds: number | undefined
}

/**
 * 동굴 문을 닫고 휴대폰을 눕혀 둔 동안 화면을 거의 검게 덮는다.
 * 웹에서는 화면 밝기를 바꾸거나 화면을 끌 수 없고(끄면 센서도 멈춰 휴대폰을 든 걸 모른다), 대신 검게 칠하면
 * OLED(iPhone)에서는 그 부분 픽셀이 꺼져 실제로 어둡고 배터리도 덜 쓴다. 들면 바로 걷힌다.
 */
export function RestDimmer({ active, remainingSeconds }: RestDimmerProps) {
  return (
    <div className={`${styles.root} ${active ? styles.active : ''}`} aria-hidden="true">
      {remainingSeconds !== undefined && <p className={styles.time}>{formatRestTime(remainingSeconds)}</p>}
    </div>
  )
}
