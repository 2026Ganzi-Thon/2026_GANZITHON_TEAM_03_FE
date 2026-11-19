import { useEffect, useRef } from 'react'
import doorTexture from '@/assets/images/cave-door-texture.webp'
import styles from './RestDimmer.module.css'

export interface RestDimmerProps {
  /** 휴대폰을 눕혀 쉬는 중이면 true — 돌문이 위에서 떨어져 닫히고 화면이 어두워진다 */
  active: boolean
}

// 돌문이 떨어지는 동작: 점점 빨라지며 떨어져(0.55초) 바닥에 닿으면 살짝 튀었다 멈춘다
const SLAM: Keyframe[] = [
  { transform: 'translateY(-102%)', easing: 'cubic-bezier(0.5, 0, 1, 0.5)' },
  { transform: 'translateY(0)', offset: 0.62, easing: 'ease-out' },
  { transform: 'translateY(-2.2%)', offset: 0.72, easing: 'ease-in' },
  { transform: 'translateY(0)', offset: 0.82, easing: 'ease-out' },
  { transform: 'translateY(-0.5%)', offset: 0.9, easing: 'ease-in' },
  { transform: 'translateY(0)' },
]
const SLAM_MS = 900
const IMPACT_MS = SLAM_MS * 0.62

/**
 * 동굴 문을 닫고 휴대폰을 눕혀 둔 동안: 화면 전체 크기의 돌문이 위에서 "쿵" 떨어져 닫히고, 빛이 막힌 듯 어두워진다(검정 88%).
 * 휴대폰을 들면 문이 위로 빠르게 올라가며 걷힌다.
 * 웹에서는 화면 밝기를 바꾸거나 끌 수 없어서(끄면 센서도 멈춰 든 것을 모른다) 어둡게 칠한다 — OLED(iPhone)에서는 어두운 만큼 덜 밝고 배터리도 덜 쓴다.
 * 남은 시간은 따로 그리지 않는다 — 페이지가 남은 시간 알약을 이 위로 올려 은은하게 보여준다.
 */
export function RestDimmer({ active }: RestDimmerProps) {
  const doorRef = useRef<HTMLDivElement>(null)
  const shadeRef = useRef<HTMLDivElement>(null)
  const first = useRef(true)

  useEffect(() => {
    const door = doorRef.current
    const shade = shadeRef.current
    if (!door || !shade) return
    // 처음 그릴 때 닫혀 있지 않으면 아무 움직임 없이 문을 위에 숨겨 둔다
    if (first.current) {
      first.current = false
      if (!active) return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timers: number[] = []
    if (active) {
      if (reduce) {
        door.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(0)' }], { duration: 1, fill: 'forwards' })
        shade.animate([{ opacity: 0 }, { opacity: 0.88 }], { duration: 600, fill: 'forwards' })
      } else {
        door.animate(SLAM, { duration: SLAM_MS, fill: 'forwards' })
        // 닿는 순간 안드로이드는 짧게 진동(iPhone 웹은 진동 API 없음), 그 뒤 빛이 막힌 듯 서서히 어두워진다
        timers.push(window.setTimeout(() => navigator.vibrate?.(35), IMPACT_MS))
        shade.animate([{ opacity: 0 }, { opacity: 0.88 }], { duration: 1200, delay: IMPACT_MS + 120, easing: 'ease-in', fill: 'forwards' })
      }
    } else {
      // 들면 빠르게 열린다
      door.animate([{ transform: getComputedStyle(door).transform === 'none' ? 'translateY(0)' : getComputedStyle(door).transform }, { transform: 'translateY(-102%)' }], {
        duration: reduce ? 1 : 320,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        fill: 'forwards',
      })
      shade.animate([{ opacity: Number(getComputedStyle(shade).opacity) }, { opacity: 0 }], { duration: reduce ? 1 : 200, fill: 'forwards' })
    }
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [active])

  return (
    <div className={styles.root} aria-hidden="true">
      <div ref={doorRef} className={styles.door} style={{ backgroundImage: `url(${doorTexture})` }}>
        <div ref={shadeRef} className={styles.shade} />
      </div>
    </div>
  )
}
