import { useRef } from 'react'
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

/**
 * 휴식 시간 고르기: 세로로 놓인 알약 3개, 골라진 것만 크고 진하다(시안 37:26).
 * 임의 결정(확인 필요): 알약을 누르면 그 시간이 골라지고 순서·자리는 그대로(돌아가는 휠이 아님). 시안은 정지 화면 한 장뿐이다.
 * 키보드는 라디오 그룹처럼 위·아래 화살표로 옮긴다.
 */
export function DurationPicker({ options, value, onChange, disabled = false }: DurationPickerProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + options.length) % options.length
    onChange(options[next])
    refs.current[next]?.focus()
  }

  return (
    <div className={styles.root} role="radiogroup" aria-label="휴식 시간">
      {options.map((seconds, index) => {
        const selected = seconds === value
        return (
          <button
            key={seconds}
            ref={(element) => {
              refs.current[index] = element
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${seconds / 60}분`}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            className={styles.pill}
            data-selected={selected || undefined}
            onClick={() => onChange(seconds)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {formatRestTime(seconds)}
          </button>
        )
      })}
    </div>
  )
}
