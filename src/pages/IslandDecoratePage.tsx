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
 * 카드를 한 번 누르면 그 아이템이 섬에 놓여 보이고(미리보기, 한 번에 하나), 선택된 카드를 한 번 더 누르면 구매 확인이 뜬다.
 * 산 아이템은 섬에 계속 놓여 있다. 탭바는 없다.
 * "내 양털"은 이 화면의 조회 값(woolBalance)을 쓴다 — 다른 화면과 아직 맞지 않는 임시 상태(docs/decisions.md).
 */
export default function IslandDecoratePage({ onBack, onOpenSettings }: IslandDecoratePageProps) {
  const { state, retry } = useIslandItems()
  const { state: purchaseState, purchase, reset } = usePurchaseIslandItem()
  const [category, setCategory] = useState<IslandCategoryFilter>('ALL')
  const [expanded, setExpanded] = useState(false)
  /** 섬에 놓아 보는 중인 아이템(카드 선택) */
  const [previewId, setPreviewId] = useState<string | null>(null)
  /** 구매 확인 중인 아이템(모달) */
  const [purchaseId, setPurchaseId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const items = state.status === 'success' ? state.items : []
  const woolBalance = state.status === 'success' ? state.woolBalance : undefined
  const visibleItems = category === 'ALL' ? items : items.filter((item) => item.category === category)
  // 목록을 다시 받아 보유·잔액이 바뀌면 모달도 최신 값을 쓴다
  const purchaseTarget = items.find((item) => item.itemId === purchaseId) ?? null
  // 섬에 놓이는 것: 가진 아이템 전부 + 지금 놓아 보는 하나
  const placed = items.filter((item) => item.owned || item.itemId === previewId)

  const selectCategory = (value: IslandCategoryFilter) => {
    setCategory(value)
    // 임의 결정(확인 필요): 접힌 상태에서 칩을 누르면 결과가 보이도록 시트를 펼친다
    setExpanded(true)
  }

  // 임의 결정(확인 필요): 첫 번째 누름은 선택(섬에 놓아 보기), 선택된 카드를 다시 누르면 구매 확인.
  // 다른 카드를 누르면 선택이 옮겨 가고, 구매 확인을 취소해도 선택은 남는다
  const selectItem = (item: IslandItem) => {
    if (item.owned) return
    if (item.itemId !== previewId) {
      setPreviewId(item.itemId)
      setAnnouncement(`섬에 놓아 봤어요: ${item.name}. 한 번 더 누르면 구매해요.`)
      return
    }
    reset()
    setPurchaseId(item.itemId)
  }

  const confirmPurchase = async () => {
    if (!purchaseTarget) return
    const name = purchaseTarget.name
    if (await purchase(purchaseTarget.itemId)) {
      setPurchaseId(null)
      setPreviewId(null)
      setAnnouncement(`구매했어요: ${name}`)
    }
  }

  return (
    <main className={styles.page}>
      <IslandDecorateHeader woolCount={woolBalance} onOpenSettings={onOpenSettings} />
      <BackButton className={styles.back} onClick={onBack} />

      <div className={styles.stage} data-expanded={expanded || undefined}>
        <IslandScene placed={placed} />
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
        <IslandItemGrid
          status={state.status}
          items={visibleItems}
          selectedId={previewId}
          onSelect={selectItem}
          onRetry={retry}
        />
      </DecorSheet>

      <IslandPurchaseModal
        item={purchaseTarget}
        woolBalance={woolBalance ?? 0}
        state={purchaseState}
        onConfirm={() => void confirmPurchase()}
        onClose={() => setPurchaseId(null)}
      />

      <p className={styles.visuallyHidden} role="status">
        {announcement}
      </p>
    </main>
  )
}
