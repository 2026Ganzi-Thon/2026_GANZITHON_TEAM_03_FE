import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { formatRestTime } from './useRestCountdown'
import styles from './DurationPicker.module.css'

export interface DurationPickerProps {
  /** 고를 수 있는 시간(초), 위에서 아래 순서 */
  options: readonly number[]
  /** 골라진 시간(초) */
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

/** 한 칸 높이(px). DurationPicker.module.css 의 --row 와 같다 */
const ROW = 42

/**
 * 휴식 시간 휠(iOS 시간 선택처럼): 위아래로 끌면 한 칸씩 걸리며 넘어가고, 가운데 칸이 골라진 시간이다.
 * 세 칸이 보이고 가운데만 크고 진하다(시안 37:26 의 알약 모양). 다른 칸을 누르면 그 칸이 가운데로 온다.
 * 키보드는 위·아래 화살표, Home·End. 화면 낭독기에는 값 하나를 고르는 spinbutton 으로 알린다.
 * 임의 결정(확인 필요): 휠 방식 — 사용자 요청(시안은 정지 화면 한 장).
 */
export function DurationPicker({ options, value, onChange, disabled = false }: DurationPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const valueIndex = Math.max(0, options.indexOf(value))
  /** 끄는 동안 가운데에 와 있는 칸. 손을 떼기 전에도 크기가 바로 바뀌게 스크롤 위치로 따로 들고 있는다 */
  const [centerIndex, setCenterIndex] = useState(valueIndex)

  const placed = useRef(false)

  /** 처음 붙을 때 한 번만 골라진 칸이 가운데 오게 놓는다(움직임 없이). 그 뒤로는 스크롤 위치가 값을 정한다 */
  const attach = (element: HTMLDivElement | null) => {
    scrollRef.current = element
    if (element && !placed.current) {
      element.scrollTop = valueIndex * ROW
      placed.current = true
    }
  }

  const scrollToIndex = (index: number) => {
    scrollRef.current?.scrollTo({ top: index * ROW, behavior: 'smooth' })
  }

  const select = (index: number) => {
    const clamped = Math.min(options.length - 1, Math.max(0, index))
    setCenterIndex(clamped)
    if (options[clamped] !== value) onChange(options[clamped])
    scrollToIndex(clamped)
  }

  const handleScroll = () => {
    const element = scrollRef.current
    if (!element) return
    const index = Math.min(options.length - 1, Math.max(0, Math.round(element.scrollTop / ROW)))
    if (index === centerIndex) return
    setCenterIndex(index)
    if (options[index] !== value) onChange(options[index])
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next =
      event.key === 'ArrowDown'
        ? centerIndex + 1
        : event.key === 'ArrowUp'
          ? centerIndex - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? options.length - 1
              : null
    if (next === null) return
    event.preventDefault()
    select(next)
  }

  const minutes = options[centerIndex] / 60

  return (
    <div
      ref={attach}
      className={styles.wheel}
      role="spinbutton"
      aria-label="휴식 시간"
      aria-valuemin={options[0] / 60}
      aria-valuemax={options[options.length - 1] / 60}
      aria-valuenow={minutes}
      aria-valuetext={`${minutes}분`}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      data-disabled={disabled || undefined}
      onScroll={handleScroll}
      onKeyDown={disabled ? undefined : handleKeyDown}
    >
      {options.map((seconds, index) => (
        <div key={seconds} className={styles.row} aria-hidden="true">
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            className={styles.pill}
            data-selected={index === centerIndex || undefined}
            onClick={() => select(index)}
          >
            {formatRestTime(seconds)}
          </button>
        </div>
      ))}
    </div>
  )
}
