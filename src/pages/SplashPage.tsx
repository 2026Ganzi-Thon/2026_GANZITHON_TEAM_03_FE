import { useEffect, useRef, useState } from 'react'
import { SplashArtwork } from '@/features/onboarding'
import styles from './SplashPage.module.css'

// 임의 결정(확인 필요): 시안에 시간이 없어 정함. 로고만 → 섬이 천천히 올라옴(1.4초, SplashArtwork.module.css) → 머무름 → 0.5초 사라짐. 합계 3.5초
const LOGO_MS = 850
const ISLANDS_MS = 1_400
const HOLD_MS = 750
const LEAVE_MS = 500

type Phase = 'logo' | 'islands' | 'leaving'

export interface SplashPageProps {
  onComplete: () => void
}

export default function SplashPage({ onComplete }: SplashPageProps) {
  const [phase, setPhase] = useState<Phase>('logo')
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    // 움직임 줄이기 설정이면 사라지는 시간 없이 머무는 시간만 지킨다
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timers = [
      window.setTimeout(() => setPhase('islands'), LOGO_MS),
      window.setTimeout(() => setPhase('leaving'), LOGO_MS + ISLANDS_MS + HOLD_MS),
      // 다 사라진 뒤에 넘긴다 — 뒤에는 body 배경(--color-bg)이 보이고, 온보딩은 마운트되며 서서히 나타난다
      window.setTimeout(
        () => onCompleteRef.current(),
        LOGO_MS + ISLANDS_MS + HOLD_MS + (reduceMotion ? 0 : LEAVE_MS),
      ),
    ]
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  return (
    <main
      className={`${styles.page} ${phase === 'leaving' ? styles.leaving : ''}`}
      aria-label="폴리의 섬 시작 화면"
    >
      <SplashArtwork variant={phase === 'logo' ? 1 : 2} className={styles.artwork} />
    </main>
  )
}
