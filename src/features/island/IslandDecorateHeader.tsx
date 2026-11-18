import { Header, Icon, IconButton, WoolCounter } from '@/shared/ui'
import styles from './IslandDecorateHeader.module.css'

export interface IslandDecorateHeaderProps {
  /** 양털 잔액. 모르면(불러오는 중·실패) 숫자 자리에 막대를 보인다 */
  woolCount?: number
  onOpenSettings?: () => void
}

/** 섬 꾸미기 머리: 제목 "섬 꾸미기" + 섬 아이콘, 오른쪽에 양털 알약과 설정 아이콘. */
export function IslandDecorateHeader({ woolCount, onOpenSettings }: IslandDecorateHeaderProps) {
  return (
    <Header
      title={
        <span className={styles.title}>
          섬 꾸미기
          <Icon name="island" size={24} className={styles.icon} />
        </span>
      }
      actions={
        <>
          <WoolCounter count={woolCount} loading={woolCount === undefined} />
          {/* 설정 화면(/settings)으로 — 이동은 라우트가 연결 */}
          <IconButton icon="settings" aria-label="설정" className={styles.settings} onClick={onOpenSettings} />
        </>
      }
    />
  )
}
