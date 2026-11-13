import { useRef } from 'react'
import type { ComponentPropsWithoutRef, KeyboardEvent } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Tabs.module.css'

export interface TabItem {
  value: string
  label: string
  disabled?: boolean
}

export interface TabsProps extends Omit<ComponentPropsWithoutRef<'div'>, 'onChange'> {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
}

/**
 * 가로로 나란히 놓인 구간 탭(움직이기 / 마음 돌봄 ...). 칸 너비는 모두 같다.
 * ← → Home End 키로 이동한다. 탭 내용은 쓰는 쪽에서 value 에 맞춰 그린다.
 * 접근 가능한 이름을 위해 `aria-label` 을 넘기는 것을 권장한다.
 */
export function Tabs({ items, value, onChange, className, ...rest }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((item) => !item.disabled)
    const currentIndex = enabled.findIndex((item) => item.value === value)
    let next: TabItem | undefined

    if (event.key === 'ArrowRight') next = enabled[(currentIndex + 1) % enabled.length]
    else if (event.key === 'ArrowLeft') next = enabled[(currentIndex - 1 + enabled.length) % enabled.length]
    else if (event.key === 'Home') next = enabled[0]
    else if (event.key === 'End') next = enabled[enabled.length - 1]
    if (!next) return

    event.preventDefault()
    onChange(next.value)
    // 선택이 바뀐 탭으로 포커스도 옮긴다 (roving tabindex)
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')
    buttons?.[enabled.indexOf(next)]?.focus()
  }

  return (
    <div ref={listRef} role="tablist" className={cx(styles.list, className)} onKeyDown={handleKeyDown} {...rest}>
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            className={cx(styles.tab, selected && styles.selected)}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
