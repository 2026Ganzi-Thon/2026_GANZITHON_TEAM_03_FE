import { HomeHeader, HomeShortcuts, HomeSummaryPanel, IslandHero, IslandSheep, useHomeSummary } from '@/features/home'
import type { SheepIslandLayer } from '@/features/home'
import { IslandScene, useIslandItems } from '@/features/island'
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
  // 섬 꾸미기에서 산 가구를 홈의 섬에도 놓아 보인다. 받는 중이거나 실패하면 빈 섬 그대로(가구만 안 보임)
  const { state: islandState } = useIslandItems()
  const ownedItems = islandState.status === 'success' ? islandState.items.filter((item) => item.owned) : []
  // 양은 홈 섬에만 있다. 놓인 가구 그림을 넘겨 양 앞에 오는 가구가 양을 가리게 한다.
  // 임의 결정(확인 필요): 바닥에 깔리는 가구는 분류 PATH(러그·디딤돌)로 본다 — 양보다 늘 아래
  const sheepLayers: SheepIslandLayer[] = ownedItems.flatMap((item) =>
    item.placedImageUrl ? [{ src: item.placedImageUrl, flat: item.category === 'PATH' }] : [],
  )

  return (
    <main className={styles.page}>
      <HomeHeader state={state} onOpenSettings={onOpenSettings} />
      <HomeSummaryPanel
        state={state}
        onRetry={retry}
        onOpenEmotion={onOpenEmotion}
        onOpenMaturedCheese={onOpenMaturedCheese}
      />
      <IslandHero onOpenDecorate={onOpenDecorate} island={
          <IslandScene placed={ownedItems} animate={false} overlay={<IslandSheep layers={sheepLayers} />} />
        } />
      <HomeShortcuts onOpenRecords={onOpenRecords} onCloseCave={onCloseCave} />
    </main>
  )
}
