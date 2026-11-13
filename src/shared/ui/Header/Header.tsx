import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Header.module.css'

export interface HeaderProps extends Omit<ComponentPropsWithoutRef<'header'>, 'title'> {
  /** 화면 제목. h1 으로 렌더된다 */
  title: ReactNode
  /** 오른쪽에 놓는 요소 (예: WoolCounter, 안내 IconButton) */
  actions?: ReactNode
}

/** 화면 맨 위 제목 줄. 뒤로가기 화살표는 그 아래에 BackButton 을 따로 놓는다. */
export function Header({ title, actions, className, ...rest }: HeaderProps) {
  return (
    <header className={cx(styles.header, className)} {...rest}>
      <h1 className={styles.title}>{title}</h1>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
