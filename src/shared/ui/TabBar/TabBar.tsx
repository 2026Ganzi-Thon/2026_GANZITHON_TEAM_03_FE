import type { ComponentPropsWithoutRef } from 'react'
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
                {/* 시안: 아이콘 24px, 동굴만 26px(윤곽이 작아 보이지 않게) — 자리는 24px 로 같다 */}
                <Icon name={item.icon} size={item.icon === 'cave' ? 26 : 24} className={item.icon === 'cave' ? styles.iconLarge : undefined} />
                <span className={styles.label}>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
