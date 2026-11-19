import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/shared/ui/Button'
import { PageIndicator } from '@/shared/ui/PageIndicator'
import styles from './GuideTour.module.css'

export interface GuideStep {
  /** 가리킬 요소 — 화면에서 `[data-guide="<target>"]` 로 찾는다 */
  target: string
  title: string
  body: string
}

export interface GuideTourProps {
  open: boolean
  steps: GuideStep[]
  onClose: () => void
}

const EDGE = 16
const GAP = 16
const ARROW_EDGE = 20

interface Placement {
  left: number
  top: number
  below: boolean
  arrowLeft: number
}

/**
 * 기능 사용법 안내: 오른쪽 위 `!` 를 누르면 흰 말풍선이 화살표로 버튼을 차례로 가리킨다(비교 시트에서 고른 안).
 * 화면은 어둡게 하지 않는다. 앱 폭 전체를 덮는 투명 막을 깔아 뒤 버튼은 눌리지 않고, 화면 아무 곳이나 누르면 다음 단계·마지막이면 닫힌다.
 */
export function GuideTour({ open, steps, onClose }: GuideTourProps) {
  // 열릴 때마다 안쪽을 새로 붙여 첫 단계부터 시작한다
  return open && steps.length > 0 ? <Tour steps={steps} onClose={onClose} /> : null
}

function Tour({ steps, onClose }: Omit<GuideTourProps, 'open'>) {
  const [index, setIndex] = useState(0)
  const [place, setPlace] = useState<Placement | null>(null)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const step = steps[index]
  const last = index === steps.length - 1

  const measure = useCallback(() => {
    const target = step && document.querySelector<HTMLElement>(`[data-guide="${step.target}"]`)
    const bubble = bubbleRef.current
    const layer = layerRef.current
    if (!target || !bubble || !layer) return setPlace(null)
    const t = target.getBoundingClientRect()
    const area = layer.getBoundingClientRect()
    const width = bubble.offsetWidth
    const height = bubble.offsetHeight
    const centerX = t.left + t.width / 2 - area.left
    const left = Math.min(Math.max(EDGE, centerX - width / 2), area.width - EDGE - width)
    const below = t.top - area.top < height + GAP + 12
    const top = below ? t.bottom - area.top + GAP : t.top - area.top - GAP - height
    const arrowLeft = Math.min(Math.max(ARROW_EDGE, centerX - left), width - ARROW_EDGE)
    setPlace({ left, top, below, arrowLeft })
  }, [step])

  // 단계가 바뀌면 대상이 화면 안에 오게 한 뒤 위치를 잰다
  useLayoutEffect(() => {
    if (!step) return
    const target = document.querySelector<HTMLElement>(`[data-guide="${step.target}"]`)
    if (target) {
      const r = target.getBoundingClientRect()
      if (r.top < 0 || r.bottom > window.innerHeight) target.scrollIntoView({ block: 'center' })
    }
    measure()
  }, [step, measure])

  useEffect(() => {
    const onResize = () => measure()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [measure, onClose])

  // 열리면 "다음"(마지막이면 "알겠어요")에 포커스
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true })
  }, [index])

  if (!step) return null

  const advance = () => (last ? onClose() : setIndex((i) => i + 1))

  return createPortal(
    <div ref={layerRef} className={styles.layer} onClick={advance}>
      <div
        ref={bubbleRef}
        className={styles.bubble}
        role="dialog"
        aria-live="polite"
        aria-label={step.title}
        style={place ? { left: place.left, top: place.top } : { visibility: 'hidden' }}
        onClick={(event) => event.stopPropagation()}
      >
        <span
          className={`${styles.arrow} ${place?.below ? styles.arrowUp : styles.arrowDown}`}
          style={{ left: place?.arrowLeft ?? ARROW_EDGE }}
          aria-hidden="true"
        />
        <p className={styles.title}>{step.title}</p>
        <p className={styles.body}>{step.body}</p>
        <div className={styles.footer}>
          <PageIndicator count={steps.length} current={index} />
          <div className={styles.actions}>
            {!last && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                건너뛰기
              </Button>
            )}
            <Button ref={nextRef} size="sm" onClick={advance}>
              {last ? '알겠어요' : '다음'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
