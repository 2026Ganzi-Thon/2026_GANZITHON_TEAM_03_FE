import { Header, IconButton, WoolCounter } from '@/shared/ui'
import styles from './CheeseHeader.module.css'

export interface CheeseHeaderProps {
  /** 보유한 양털 개수. 양털은 care 기능 소관이라 페이지가 props 로 내려준다 */
  woolCount: number
  onOpenGuide?: () => void
}

/**
 * 우유와 치즈 화면 공통 머리: 제목 "우유와 치즈", 오른쪽에 양털 알약과 안내(!) 아이콘.
 * 기능끼리 import 금지라 emotion 의 EmotionHeader 와 같은 구성을 여기에도 둔다(공용 승격 후보).
 */
export function CheeseHeader({ woolCount, onOpenGuide }: CheeseHeaderProps) {
  return (
    <Header
      title="우유와 치즈"
      actions={
        <>
          <WoolCounter count={woolCount} />
          {/* 안내 내용은 아직 없다 — 콜백만 연결 */}
          <IconButton icon="alert-circle" aria-label="안내" className={styles.guide} onClick={onOpenGuide} />
        </>
      }
    />
  )
}
