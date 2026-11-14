import { useEffect } from 'react'
import sheepImage from '@/assets/images/sheep.png'
import styles from './FeedingAnimation.module.css'

/** 연출 길이(ms). CSS 의 animation 시간과 맞춘다. */
const DURATION_MS = 1100

export interface FeedingAnimationProps {
  /** 연출이 끝나면 한 번 호출된다 */
  onDone: () => void
}

/**
 * 저장에 성공한 뒤 양이 살짝 튀는 짧은 연출.
 * 임의 결정(확인 필요): 시안이 없어 1.1초 동안 양이 두 번 튀는 정도로 정함. `prefers-reduced-motion` 이면 연출 없이 바로 끝낸다.
 */
export function FeedingAnimation({ onDone }: FeedingAnimationProps) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(onDone, reduced ? 0 : DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [onDone])

  return (
    <div className={styles.overlay} role="status" aria-live="polite">
      <img className={styles.sheep} src={sheepImage} width={160} height={160} decoding="sync" alt="" />
      <p className={styles.text}>냠냠, 잘 먹었어요!</p>
    </div>
  )
}
