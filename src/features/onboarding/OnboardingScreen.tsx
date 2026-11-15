import { useState } from 'react'
import { Button, BackButton, PageIndicator } from '@/shared/ui'
import { onboardingSlides } from './slides'
import styles from './OnboardingScreen.module.css'

export interface OnboardingScreenProps {
  onComplete: () => void
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [current, setCurrent] = useState(0)
  const slide = onboardingSlides[current]
  const isLast = current === onboardingSlides.length - 1

  const goNext = () => {
    if (isLast) onComplete()
    else setCurrent((step) => step + 1)
  }

  return (
    <main className={styles.page} aria-label="온보딩">
      <header className={styles.header}>
        <BackButton
          className={styles.back}
          aria-label="이전 단계"
          disabled={current === 0}
          onClick={() => setCurrent((step) => Math.max(0, step - 1))}
        />
        <button className={styles.skip} type="button" onClick={onComplete}>건너뛰기</button>
      </header>

      <PageIndicator className={styles.indicator} count={onboardingSlides.length} current={current} />

      <section className={styles.copy} aria-live="polite">
        <h1>{slide.title}</h1>
        <p>{slide.description}</p>
      </section>

      <div className={styles.artworkFrame}>
        <img
          className={styles.artwork}
          src={slide.artwork}
          alt={slide.artworkAlt}
        />
      </div>

      <Button className={styles.next} variant="primary" size="lg" fullWidth onClick={goNext}>
        {isLast ? '시작하기' : '다음으로'}
      </Button>
    </main>
  )
}
