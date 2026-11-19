import { Header, IconButton, WoolCounter } from '@/shared/ui'
import styles from './CaveHeader.module.css'

export interface CaveHeaderProps {
  /** 보유한 양털 개수. 양털은 이 기능 소관이 아니라 페이지가 props 로 내려준다. 아직 모르면 undefined(숫자 자리에 막대) */
  woolCount?: number
  /** 양털 알약을 보일지. 진행 중 화면(시안 63:1283)에는 없다. 기본 true */
  showWool?: boolean
  onOpenGuide?: () => void
}

/** 동굴 문 닫기 화면 공통 머리: 제목, 오른쪽에 양털 알약(시작 전만)과 안내(!) 아이콘. */
export function CaveHeader({ woolCount, showWool = true, onOpenGuide }: CaveHeaderProps) {
  return (
    <Header
      title="동굴 문 닫기"
      actions={
        <>
          {showWool && <WoolCounter count={woolCount} loading={woolCount === undefined} />}
          {/* 안내 내용은 아직 없다 — 콜백만 연결 */}
          <IconButton icon="alert-circle" data-guide="guide-button" aria-label="안내" className={styles.guide} onClick={onOpenGuide} />
        </>
      }
    />
  )
}
