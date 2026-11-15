import { TabBar } from '@/shared/ui'
import type { TabBarItem } from '@/shared/ui'
import styles from './AppTabBar.module.css'

const ITEMS: TabBarItem[] = [
  { value: 'home', label: '홈', icon: 'home' },
  { value: 'sheep', label: '양 돌보기', icon: 'sheep' },
  { value: 'cheese', label: '고민치즈', icon: 'cheese' },
  { value: 'cloud', label: '양털모으기', icon: 'cloud' },
  { value: 'cave', label: '동굴 닫기', icon: 'cave' },
]

interface AppTabBarProps {
  /** 현재 화면에 해당하는 탭('home' | 'sheep' | 'cheese') */
  value: string
  onChange: (value: string) => void
}

/** 앱 하단 고정 탭바. 폭은 페이지와 같이 최대 --app-max-width(440px) 가운데 정렬. */
export default function AppTabBar({ value, onChange }: AppTabBarProps) {
  return (
    <div className={styles.wrap}>
      <TabBar items={ITEMS} value={value} onChange={onChange} />
    </div>
  )
}
