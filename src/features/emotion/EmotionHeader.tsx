import { Header, IconButton, WoolCounter } from '@/shared/ui'
import styles from './EmotionHeader.module.css'

export interface EmotionHeaderProps {
  /** 보유한 양털 개수. 양털은 care 기능 소관이라 페이지가 props 로 내려준다. 아직 모르면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  onOpenGuide?: () => void
}

/** 감정 기록 화면 공통 머리: 제목 "양 먹이주기", 오른쪽에 양털 알약과 안내(!) 아이콘. */
export function EmotionHeader({ woolCount, onOpenGuide }: EmotionHeaderProps) {
  return (
    <Header
      title="양 먹이주기"
      actions={
        <>
          <WoolCounter count={woolCount} loading={woolCount === undefined} />
          {/* 안내 내용은 아직 없다 — 콜백만 연결 */}
          <IconButton icon="alert-circle" data-guide="guide-button" aria-label="안내" className={styles.guide} onClick={onOpenGuide} />
        </>
      }
    />
  )
}
