import { HomeHeader, HomeShortcuts, HomeSummaryPanel, IslandHero, useHomeSummary } from '@/features/home'
import styles from './HomePage.module.css'

export interface HomePageProps {
  onOpenEmotion?: () => void
  onOpenDecorate?: () => void
  onOpenSettings?: () => void
  onOpenRecords?: () => void
  onCloseCave?: () => void
  onOpenMaturedCheese?: () => void
}

/** 메인 홈. 이동은 라우터가 아니라 props 콜백으로 받는다. */
export default function HomePage({
  onOpenEmotion,
  onOpenDecorate,
  onOpenSettings,
  onOpenRecords,
  onCloseCave,
  onOpenMaturedCheese,
}: HomePageProps) {
  const { state, retry } = useHomeSummary()

  return (
    <main className={styles.page}>
      <HomeHeader state={state} onOpenSettings={onOpenSettings} />
      <HomeSummaryPanel
        state={state}
        onRetry={retry}
        onOpenEmotion={onOpenEmotion}
        onOpenMaturedCheese={onOpenMaturedCheese}
      />
      <IslandHero onOpenDecorate={onOpenDecorate} />
      <HomeShortcuts onOpenRecords={onOpenRecords} onCloseCave={onCloseCave} />
    </main>
  )
}
