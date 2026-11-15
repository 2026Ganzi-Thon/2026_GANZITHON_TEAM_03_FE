import { useId, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent, ReactNode } from 'react'
import styles from './DecorSheet.module.css'

export interface DecorSheetProps {
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  /** 손잡이 아래 늘 보이는 줄(분류 칩) */
  head: ReactNode
  /** 펼쳤을 때 시트 안에서 스크롤되는 내용(아이템 카드) */
  children: ReactNode
}

/** 이만큼 넘게 끌면 펼치거나 접는다(px) */
const DRAG_THRESHOLD = 48
/** 이보다 적게 움직였으면 끈 것이 아니라 누른 것으로 본다(px) */
const TAP_SLOP = 6

interface DragState {
  pointerId: number
  startY: number
  min: number
  max: number
  moved: boolean
}

/**
 * 아래에서 올라오는 시트(시안 109:265 "하단 슬라이드 팝업"). 접힘(손잡이 + 칩)과 펼침(카드 목록, 안에서 스크롤) 두 단계.
 * 손잡이를 누르면 바뀌고, 시트 어디든 위·아래로 끌어도 바뀐다 — 접혀 있으면 시트 전체를 위로,
 * 펼쳐져 있으면 손잡이·칩 줄을 아래로(카드 목록은 안에서 스크롤되므로 끌기에 쓰지 않는다).
 * 높이는 쓰는 쪽이 CSS 변수로 정한다: `--island-sheet-height`(펼친 높이), `--island-sheet-peek`(접혔을 때 보이는 높이).
 * 임의 결정(확인 필요): 두 단계 높이와 전환(0.3초 미끄러짐, 끌기 48px) — 시안은 접힌 모습 하나뿐
 */
export function DecorSheet({ expanded, onExpandedChange, head, children }: DecorSheetProps) {
  const bodyId = useId()
  const sheetRef = useRef<HTMLElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const drag = useRef<DragState | null>(null)
  const suppressClick = useRef(false)
  const [offset, setOffset] = useState<number | null>(null)

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    // 펼친 상태의 카드 목록은 스크롤 영역이라 끌기로 쓰지 않는다
    if (expanded && bodyRef.current?.contains(event.target as Node)) return
    const sheet = sheetRef.current
    const container = sheet?.offsetParent
    if (!sheet || !container) return
    const sheetRect = sheet.getBoundingClientRect()
    const visible = container.getBoundingClientRect().bottom - sheetRect.top
    // 접혀 있으면 위로만(펼친 높이까지), 펼쳐져 있으면 아래로만 끌린다
    drag.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      ...(expanded ? { min: 0, max: sheetRect.height } : { min: -(sheetRect.height - visible), max: 0 }),
      moved: false,
    }
    suppressClick.current = false
  }

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const delta = event.clientY - current.startY
    if (!current.moved) {
      if (Math.abs(delta) < TAP_SLOP) return
      // 끌기로 판정된 뒤에야 포인터를 붙잡는다 — 그 전에는 칩·손잡이 누르기가 그대로 된다
      current.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    setOffset(Math.min(current.max, Math.max(current.min, delta)))
  }

  const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    drag.current = null
    if (!current.moved) return
    // 끌었으면 뒤따르는 click(칩 선택·손잡이 전환)을 막는다
    suppressClick.current = true
    const delta = event.clientY - current.startY
    setOffset(null)
    if (!expanded && delta < -DRAG_THRESHOLD) onExpandedChange(true)
    else if (expanded && delta > DRAG_THRESHOLD) onExpandedChange(false)
  }

  // 브라우저가 제스처를 가져간 경우(스크롤 등): 제자리로
  const handlePointerCancel = () => {
    drag.current = null
    setOffset(null)
  }

  const handleClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!suppressClick.current) return
    suppressClick.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  const dragging = offset !== null
  const base = expanded ? '0px' : 'calc(var(--island-sheet-height) - var(--island-sheet-peek))'

  return (
    <section
      ref={sheetRef}
      className={styles.sheet}
      data-expanded={expanded || undefined}
      data-dragging={dragging || undefined}
      style={{ transform: `translateY(calc(${base} + ${offset ?? 0}px))` }}
      aria-label="섬 꾸미기 아이템"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
    >
      <button
        type="button"
        className={styles.handle}
        aria-expanded={expanded}
        aria-controls={bodyId}
        aria-label={expanded ? '아이템 목록 접기' : '아이템 목록 펼치기'}
        onClick={() => onExpandedChange(!expanded)}
      >
        <span className={styles.grip} aria-hidden="true" />
      </button>
      <div className={styles.head}>{head}</div>
      {/* 접혀 있으면 카드에 포커스·스크롤이 가지 않게 한다(윗부분만 살짝 보인다) */}
      <div ref={bodyRef} id={bodyId} className={styles.body} inert={!expanded}>
        {children}
      </div>
    </section>
  )
}
