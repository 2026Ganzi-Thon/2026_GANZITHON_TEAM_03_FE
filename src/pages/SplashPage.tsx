import { useEffect, useState } from 'react'
import { SplashArtwork } from '@/features/onboarding'
import styles from './SplashPage.module.css'

export interface SplashPageProps {
  onComplete: () => void
}

export default function SplashPage({ onComplete }: SplashPageProps) {
  const [variant, setVariant] = useState<1 | 2>(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (variant === 1) setVariant(2)
      else onComplete()
    }, variant === 1 ? 650 : 1_350)

    return () => window.clearTimeout(timer)
  }, [onComplete, variant])

  return (
    <main className={styles.page} aria-label="폴리의 섬 시작 화면">
      <SplashArtwork variant={variant} className={styles.artwork} />
    </main>
  )
}
