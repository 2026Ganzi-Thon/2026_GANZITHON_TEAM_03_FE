import { IconButton, WoolCounter } from '@/shared/ui'
import { IslandTitle } from './IslandTitle'
import { FALLBACK_NAME } from './greetings'
import type { HomeSummaryState } from './useHomeSummary'
import styles from './HomeHeader.module.css'

export interface HomeHeaderProps {
  state: HomeSummaryState
  onOpenSettings?: () => void
}

/** 홈 맨 위: 왼쪽 "OO의 섬" 알약, 오른쪽 "내 양털 N개" + 설정 아이콘. */
export function HomeHeader({ state, onOpenSettings }: HomeHeaderProps) {
  // 임의 결정(확인 필요): 섬 이름은 "{닉네임}의 섬"(닉네임 없으면 "폴리"), 불러오는 중·실패일 때는 "나의 섬" — Figma 는 "폴리의 섬" 한 가지만 있음
  const islandName =
    state.status === 'success' ? (state.data.nickname ?? FALLBACK_NAME) : '나'

  return (
    <header className={styles.root}>
      <IslandTitle name={islandName} />
      <div className={styles.actions}>
        {state.status === 'success' && <WoolCounter count={state.data.woolBalance} />}
        {state.status === 'loading' && (
          <span className={styles.counterSkeleton} role="status" aria-label="양털 불러오는 중" />
        )}
        <IconButton icon="settings" aria-label="설정" className={styles.settings} onClick={onOpenSettings} />
      </div>
    </header>
  )
}
