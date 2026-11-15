import { useState } from 'react'
import {
  DecorSheet,
  ISLAND_CATEGORIES,
  IslandDecorateHeader,
  IslandItemGrid,
  IslandPurchaseModal,
  IslandScene,
  useIslandItems,
  usePurchaseIslandItem,
} from '@/features/island'
import type { IslandCategoryFilter, IslandItem } from '@/features/island'
import { BackButton, Chip } from '@/shared/ui'
import styles from './IslandDecoratePage.module.css'

export interface IslandDecoratePageProps {
  onBack?: () => void
  onOpenSettings?: () => void
}

/**
 * "섬 꾸미기"(시안 102:744): 섬 그림 아래 시트에서 아이템을 분류별로 보고 양털로 산다.
 * 산 아이템을 섬 위에 놓아 보여주는 것은 2차 — 섬은 홈과 같은 고정 그림. 탭바는 없다.
 * "내 양털"은 이 화면의 조회 값(woolBalance)을 쓴다 — 다른 화면과 아직 맞지 않는 임시 상태(docs/decisions.md).
 */
export default function IslandDecoratePage({ onBack, onOpenSettings }: IslandDecoratePageProps) {
  const { state, retry } = useIslandItems()
  const { state: purchaseState, purchase, reset } = usePurchaseIslandItem()
  const [category, setCategory] = useState<IslandCategoryFilter>('ALL')
  const [expanded, setExpanded] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const items = state.status === 'success' ? state.items : []
  const woolBalance = state.status === 'success' ? state.woolBalance : undefined
  const visibleItems = category === 'ALL' ? items : items.filter((item) => item.category === category)
  // 목록을 다시 받아 보유·잔액이 바뀌면 모달도 최신 값을 쓴다
  const selected = items.find((item) => item.itemId === selectedId) ?? null

  const selectCategory = (value: IslandCategoryFilter) => {
    setCategory(value)
    // 임의 결정(확인 필요): 접힌 상태에서 칩을 누르면 결과가 보이도록 시트를 펼친다
    setExpanded(true)
  }

  const openPurchase = (item: IslandItem) => {
    if (item.owned) return
    reset()
    setSelectedId(item.itemId)
  }

  const confirmPurchase = async () => {
    if (!selected) return
    const name = selected.name
    if (await purchase(selected.itemId)) {
      setSelectedId(null)
      setAnnouncement(`구매했어요: ${name}`)
    }
  }

  return (
    <main className={styles.page}>
      <IslandDecorateHeader woolCount={woolBalance} onOpenSettings={onOpenSettings} />
      <BackButton className={styles.back} onClick={onBack} />

      <div className={styles.stage} data-expanded={expanded || undefined}>
        <IslandScene />
      </div>

      <DecorSheet
        expanded={expanded}
        onExpandedChange={setExpanded}
        head={
          <div className={styles.chips} role="group" aria-label="분류">
            {ISLAND_CATEGORIES.map(({ value, label }) => (
              <Chip key={value} selected={category === value} onClick={() => selectCategory(value)}>
                {label}
              </Chip>
            ))}
          </div>
        }
      >
        <IslandItemGrid status={state.status} items={visibleItems} onSelect={openPurchase} onRetry={retry} />
      </DecorSheet>

      <IslandPurchaseModal
        item={selected}
        woolBalance={woolBalance ?? 0}
        state={purchaseState}
        onConfirm={() => void confirmPurchase()}
        onClose={() => setSelectedId(null)}
      />

      <p className={styles.visuallyHidden} role="status">
        {announcement}
      </p>
    </main>
  )
}
