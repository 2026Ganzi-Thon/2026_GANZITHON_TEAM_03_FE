import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { BackButton } from '@/shared/ui/BackButton'
import { PageIndicator } from '@/shared/ui/PageIndicator'
import styles from './OnboardingPage.module.css'
import firstArtwork from '@/assets/onboarding/onboarding-art-one.png'
import secondArtwork from '@/assets/onboarding/onboarding-art-two.png'
import thirdArtwork from '@/assets/onboarding/onboarding-art-three.png'

const slides = [
  {
    title: <>세상이 조금 벅찬 날엔,<br />당신의 섬으로 오세요.</>,
    description: <>여기서는 잠시 숨을 골라도 괜찮아요.<br />누구의 속도도 따라가지 않아도 되는 곳이에요.</>,
    artwork: firstArtwork,
    artworkPosition: 'first',
    artworkAlt: '치즈가 놓인 아늑한 섬',
  },
  {
    title: <>어떤 마음이든,<br />여기에 놓아두세요.</>,
    description: <>오늘의 감정을 골라 양에게 먹이를 주세요.<br />긴 이야기를 쓰지 않아도 괜찮아요.</>,
    artwork: secondArtwork,
    artworkPosition: 'second',
    artworkAlt: '양을 다정하게 쓰다듬는 손',
  },
  {
    title: <>혼자 품었던 마음에<br />다른 온기가 닿을 거예요.</>,
    description: <>나누고 싶은 고민은 치즈 숙성소에 남겨요.<br />다른 섬의 누군가가 천천히 위로를 더해요.</>,
    artwork: thirdArtwork,
    artworkPosition: 'third',
    artworkAlt: '편지와 치즈를 담은 접시를 건네는 손',
  },
]

export interface OnboardingPageProps {
  onComplete: () => void
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [current, setCurrent] = useState(0)
  const slide = slides[current]
  const isLast = current === slides.length - 1

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

      <PageIndicator className={styles.indicator} count={slides.length} current={current} />

      <section className={styles.copy} aria-live="polite">
        <h1>{slide.title}</h1>
        <p>{slide.description}</p>
      </section>

      <div className={styles.artworkFrame} data-position={slide.artworkPosition}>
        <img
          className={styles.artwork}
          src={slide.artwork}
          alt={slide.artworkAlt}
        />
      </div>

      <Button className={styles.next} variant="primary" size="lg" fullWidth onClick={goNext}>
        {isLast ? '시작하기' : '다음'}
      </Button>
      <div className={styles.homeIndicator} aria-hidden="true" />
    </main>
  )
}
