import { useEffect, useState } from 'react'
import { Button, BackButton, PageIndicator } from '@/shared/ui'
import { onboardingSlides } from './slides'
import styles from './OnboardingScreen.module.css'

// 시안 그림마다 크기·자리가 다르다: 1장 가운데 340, 2장 오른쪽 끝 382, 3장 꽉 찬 393(손이 화면 밖으로 이어짐)
const artworkLayouts = [styles.artworkOne, styles.artworkTwo, styles.artworkThree]

// 앱을 연 뒤 첫 등장(스플래시 다음)만 페이드인한다. 로그인에서 뒤로 돌아올 때 등 다른 전환은 이번에 건드리지 않음
let hasEntered = false

export interface OnboardingScreenProps {
  onComplete: () => void
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [current, setCurrent] = useState(0)
  const [fadeIn] = useState(() => !hasEntered)

  useEffect(() => {
    hasEntered = true
  }, [])
  const slide = onboardingSlides[current]
  const isLast = current === onboardingSlides.length - 1

  const goNext = () => {
    if (isLast) onComplete()
    else setCurrent((step) => step + 1)
  }

  return (
    <main className={`${styles.page} ${fadeIn ? styles.enter : ''}`} aria-label="온보딩">
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
          key={current}
          className={`${styles.artwork} ${artworkLayouts[current]}`}
          src={slide.artwork}
          alt={slide.artworkAlt}
        />
      </div>

      {/* 시안: 1·2장 "다음으로"는 테두리형, 마지막 "시작하기"만 채움형 */}
      <Button className={styles.next} variant={isLast ? 'primary' : 'outline'} size="lg" fullWidth onClick={goNext}>
        {isLast ? '시작하기' : '다음으로'}
      </Button>
    </main>
  )
}
