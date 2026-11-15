import { useEffect, useRef, useState } from 'react'
import { Button, BackButton, PageIndicator } from '@/shared/ui'
import { preloadOnboardingAssets } from './preloadOnboardingAssets'
import { onboardingSlides } from './slides'
import styles from './OnboardingScreen.module.css'

// 시안 그림마다 크기·자리가 다르다: 1장 가운데 340, 2장 오른쪽 끝 382, 3장 꽉 찬 393(손이 화면 밖으로 이어짐)
const artworkLayouts = [styles.artworkOne, styles.artworkTwo, styles.artworkThree]

// 임의 결정(확인 필요): 단계가 바뀔 때 문구·그림이 옆으로 살짝 밀리며 이만큼 사라진 뒤 다음 단계가 반대쪽에서 들어와 나타난다(CSS 의 .leaving* 과 같은 값). 시안 없음
const STEP_FADE_OUT_MS = 180

// 앱을 연 뒤 첫 등장(스플래시 다음)만 페이드인한다. 로그인에서 뒤로 돌아올 때 등 다른 전환은 이번에 건드리지 않음
let hasEntered = false

export interface OnboardingScreenProps {
  onComplete: () => void
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [current, setCurrent] = useState(0)
  const [fadeIn] = useState(() => !hasEntered)

  // 단계 전환: leaving 동안 지금 문구·그림이 사라지고, 끝나면 다음 단계로 바꿔 서서히 나타나게 한다
  const [leaving, setLeaving] = useState(false)
  const [stepChanged, setStepChanged] = useState(false)
  // 앞으로 갈 때와 뒤로 갈 때 밀리는 방향이 반대다
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const fadeTimer = useRef<number | null>(null)

  useEffect(() => {
    hasEntered = true
    // 다음 단계 그림이 늦게 떠서 전환 도중에 튀어나오지 않게 미리 받아 둔다(스플래시에서 이미 받았으면 아무 일도 하지 않음)
    preloadOnboardingAssets()
    return () => {
      if (fadeTimer.current !== null) window.clearTimeout(fadeTimer.current)
    }
  }, [])
  const slide = onboardingSlides[current]
  const isLast = current === onboardingSlides.length - 1

  const changeStep = (next: number) => {
    if (leaving || next === current) return
    setStepChanged(true)
    setDirection(next > current ? 'next' : 'prev')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrent(next)
      return
    }
    setLeaving(true)
    fadeTimer.current = window.setTimeout(() => {
      fadeTimer.current = null
      setCurrent(next)
      setLeaving(false)
    }, STEP_FADE_OUT_MS)
  }

  const goNext = () => {
    if (isLast) onComplete()
    else changeStep(current + 1)
  }

  // 사라지는 중인 요소에 나타나는 애니메이션이 같이 걸리면 깜빡이므로 둘 중 하나만 붙인다
  const forward = direction === 'next'
  const stepClass = leaving
    ? forward
      ? styles.leavingNext
      : styles.leavingPrev
    : stepChanged
      ? forward
        ? styles.stepInNext
        : styles.stepInPrev
      : ''

  return (
    <main className={`${styles.page} ${fadeIn ? styles.enter : ''}`} aria-label="온보딩">
      <header className={styles.header}>
        <BackButton
          className={styles.back}
          aria-label="이전 단계"
          disabled={current === 0}
          onClick={() => changeStep(Math.max(0, current - 1))}
        />
        <button className={styles.skip} type="button" onClick={onComplete}>건너뛰기</button>
      </header>

      <PageIndicator className={styles.indicator} count={onboardingSlides.length} current={current} />

      <section className={styles.copy} aria-live="polite">
        <div key={current} className={stepClass}>
          <h1>{slide.title}</h1>
          <p>{slide.description}</p>
        </div>
      </section>

      <div className={styles.artworkFrame}>
        <img
          key={current}
          className={`${styles.artwork} ${artworkLayouts[current]} ${stepClass}`}
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
