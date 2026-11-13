import { ActionCard } from '@/shared/ui'
import styles from './HomeShortcuts.module.css'

export interface HomeShortcutsProps {
  onOpenRecords?: () => void
  onCloseCave?: () => void
}

/** 홈 아래쪽 이동 카드 2개: 내 기록·보관함, 동굴 문 닫기. */
export function HomeShortcuts({ onOpenRecords, onCloseCave }: HomeShortcutsProps) {
  return (
    <nav className={styles.root} aria-label="바로가기">
      <ActionCard
        variant="outline"
        icon="library"
        title="내 기록, 보관함"
        description="내 기록을 확인해보세요"
        onClick={onOpenRecords}
      />
      <ActionCard
        variant="filled"
        icon="cave-filled"
        title="동굴 문 닫기"
        description="동굴에서 휴식 취하기"
        onClick={onCloseCave}
      />
    </nav>
  )
}
