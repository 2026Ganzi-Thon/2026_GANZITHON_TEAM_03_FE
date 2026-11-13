import type { ComponentPropsWithoutRef, CSSProperties } from 'react'
import { cx } from '@/shared/lib/cx'
import { Icon } from '@/shared/ui/Icon'
import type { IconName } from '@/shared/ui/Icon'
import styles from './TabBar.module.css'

export interface TabBarItem {
  value: string
  label: string
  icon: IconName
}

export interface TabBarProps extends Omit<ComponentPropsWithoutRef<'nav'>, 'onChange'> {
  items: TabBarItem[]
  /** 현재 화면에 해당하는 항목의 value */
  value: string
  onChange: (value: string) => void
}

// Figma 측정값(홈 프레임 36:22 탭바 63:1234, 항목 60×60 기준): 아이콘 크기와 항목 위에서 아이콘 윗변까지의 거리(px).
// 아이콘 모양마다 시각 중심을 맞춰 둔 값이라 아이콘마다 조금씩 다르다. 없는 아이콘은 24px·위 10px.
const ICON_SIZE: Partial<Record<IconName, number>> = { cave: 26 }
const ICON_TOP: Partial<Record<IconName, number>> = { home: 11, sheep: 10, cheese: 10, cloud: 9, cave: 8 }

/**
 * 화면 아래 메뉴(홈 / 양 돌보기 / 고민치즈 / 양털모으기 / 동굴 닫기).
 * 위치(fixed 등)는 쓰는 쪽에서 정한다. 라우터에 의존하지 않으므로 onChange 에서 이동시킨다.
 */
export function TabBar({ items, value, onChange, className, ...rest }: TabBarProps) {
  return (
    <nav aria-label="하단 메뉴" className={cx(styles.nav, className)} {...rest}>
      <ul className={styles.list}>
        {items.map((item) => {
          const active = item.value === value
          return (
            <li key={item.value} className={styles.cell}>
              <button
                type="button"
                className={cx(styles.item, active && styles.active)}
                aria-current={active ? 'page' : undefined}
                onClick={() => onChange(item.value)}
              >
                <Icon
                  name={item.icon}
                  size={ICON_SIZE[item.icon] ?? 24}
                  className={styles.icon}
                  style={{ '--icon-top': `${ICON_TOP[item.icon] ?? 10}px` } as CSSProperties}
                />
                <span className={styles.label}>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
