import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './GuideNudge.module.css'

export interface GuideNudgeProps {
  open: boolean
  /** 가리킬 `!` 버튼의 data-guide 값 */
  target: string
  /** 말풍선을 눌렀을 때 — 사용법 안내를 연다 */
  onOpen: () => void
  /** 말풍선 밖을 눌렀을 때 — 말풍선만 닫는다(누른 버튼은 그대로 동작) */
  onDismiss: () => void
  /** 실제로 화면에 보인 순간 — 본 것으로 기억하는 데 쓴다 */
  onShown?: () => void
}

const EDGE = 16
const BELOW_CENTER = 22

/**
 * 화면에 처음 들어왔을 때 오른쪽 위 `!` 바로 아래에 뜨는 한 줄 말풍선 "처음이신가요? 여기를 눌러 사용법을 봐요."
 * 화면을 막지 않는다 — 뒤 화면은 그대로 눌리고, 말풍선 밖을 누르면 말풍선만 사라진다.
 * 다른 팝업(<dialog open>, 예: 앱 설치 안내)이 떠 있으면 그것이 닫힐 때까지 기다렸다가 뜬다.
 */
export function GuideNudge({ open, target, onOpen, onDismiss, onShown }: GuideNudgeProps) {
  const [blocked, setBlocked] = useState(() => document.querySelector('dialog[open]') !== null)

  // 다른 팝업이 열려 있으면 닫힐 때까지 기다린다
  useEffect(() => {
    if (!open) return
    const check = () => setBlocked(document.querySelector('dialog[open]') !== null)
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open'] })
    return () => observer.disconnect()
  }, [open])

  return open && !blocked ? <Nudge target={target} onOpen={onOpen} onDismiss={onDismiss} onShown={onShown} /> : null
}

function Nudge({ target, onOpen, onDismiss, onShown }: Omit<GuideNudgeProps, 'open'>) {
  const ref = useRef<HTMLButtonElement>(null)
  const [place, setPlace] = useState<{ top: number; right: number; arrowLeft: number } | null>(null)

  const measure = useCallback(() => {
    const button = document.querySelector<HTMLElement>(`[data-guide="${target}"]`)
    const bubble = ref.current
    if (!button || !bubble) return setPlace(null)
    const b = button.getBoundingClientRect()
    const appWidth = Math.min(window.innerWidth, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-max-width')) || window.innerWidth)
    const appRight = (window.innerWidth + appWidth) / 2
    const right = window.innerWidth - (appRight - EDGE)
    const bubbleLeft = appRight - EDGE - bubble.offsetWidth
    const centerX = b.left + b.width / 2
    setPlace({ top: b.top + b.height / 2 + BELOW_CENTER, right, arrowLeft: Math.min(Math.max(14, centerX - bubbleLeft), bubble.offsetWidth - 14) })
  }, [target])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  useEffect(() => {
    onShown?.()
    // 뜬 순간 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onResize = () => measure()
    // 말풍선 밖을 누르면 닫는다 — 막지 않으므로 누른 대상은 그대로 동작한다
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onDismiss()
    }
    window.addEventListener('resize', onResize)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      window.removeEventListener('resize', onResize)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [measure, onDismiss])

  return createPortal(
    <button
      ref={ref}
      type="button"
      className={styles.nudge}
      style={place ? { top: place.top, right: place.right } : { visibility: 'hidden' }}
      onClick={onOpen}
    >
      <span className={styles.arrow} style={{ left: place?.arrowLeft ?? 14 }} aria-hidden="true" />
      <span className={styles.text}>
        <b>처음이신가요?</b> 여기를 눌러 사용법을 봐요.
      </span>
    </button>,
    document.body,
  )
}
