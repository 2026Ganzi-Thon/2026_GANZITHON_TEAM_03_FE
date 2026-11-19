import { useState } from 'react'
import {
  CHEESE_GUIDE_CONCERNS,
  CHEESE_GUIDE_STEPS,
  CheeseBanner,
  CheeseHeader,
  CheeseVaultButton,
  MilkCarousel,
  useConcerns,
} from '@/features/cheese'
import { Button, GuideTour } from '@/shared/ui'
import styles from './CheesePage.module.css'

export interface CheesePageProps {
  /** 보유한 양털 개수. care 기능 소관이라 호출하는 쪽이 넘긴다 */
  /** 아직 받지 못했으면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  /** 현재 페이지·선택은 상세에 다녀와도 유지되도록 호출하는 쪽이 들고 있다 */
  page: number
  onPageChange: (page: number) => void
  selectedId: string | null
  onSelect: (concernId: string | null) => void
  /** 고민 상세로 — "위로 남기기" 버튼과 카드의 "…더보기" */
  onOpenConcern: (concernId: string) => void
  /** 아래 금색 카드 "고민 치즈 남기기" — 고민 쓰기로 */
  onWrite?: () => void
  /** "고민 목록" 줄 오른쪽 "내 치즈 보관함" 버튼 */
  onOpenVault?: () => void
}

/**
 * "우유와 치즈"(시안 396:293): 이웃 폴리의 고민(우유병)을 3개씩 넘겨 보고 하나를 골라 위로하러 간다.
 * "고민 목록" 줄 오른쪽 버튼은 보관함으로, 아래 금색 카드 "고민 치즈 남기기"는 고민 쓰기로 간다.
 */
export default function CheesePage({
  woolCount,
  page,
  onPageChange,
  selectedId,
  onSelect,
  onOpenConcern,
  onWrite,
  onOpenVault,
}: CheesePageProps) {
  const { state: loaded, retry } = useConcerns()
  // 오른쪽 위 `!` — 사용법 안내. 안내 중에는 고정 예시 우유로 그리고 첫 우유를 고른 상태로 보인다(화살표가 늘 같은 자리를 가리키게)
  const [guideOpen, setGuideOpen] = useState(false)
  const state = guideOpen ? ({ status: 'success', items: CHEESE_GUIDE_CONCERNS } as const) : loaded
  const items = state.status === 'success' ? state.items : []
  // 목록이 줄어서(위로를 남긴 고민이 빠짐) 선택한 고민이 사라졌으면 선택 없음으로 본다
  const selected = guideOpen
    ? CHEESE_GUIDE_CONCERNS[0].concernId
    : items.some((item) => item.concernId === selectedId)
      ? selectedId
      : null

  return (
    <main className={styles.page}>
      <CheeseHeader woolCount={woolCount} onOpenGuide={() => setGuideOpen(true)} />
      <p className={styles.intro}>
        이웃 폴리의 우유를 골라 답변하고
        <br />
        치즈를 만들어주세요
      </p>

      <div className={styles.listHead}>
        <h2 className={styles.listTitle}>고민 목록</h2>
        <div data-guide="vault">
          <CheeseVaultButton onClick={onOpenVault} />
        </div>
      </div>

      {state.status === 'error' ? (
        <div className={styles.status} role="alert">
          <p className={styles.message}>고민을 불러오지 못했어요.</p>
          <Button variant="outline" size="sm" onClick={retry}>
            다시 시도
          </Button>
        </div>
      ) : state.status === 'success' && items.length === 0 ? (
        <div className={styles.status}>
          {/* 임의 결정(확인 필요): 빈 목록 안내 문구 — 시안에 없음 */}
          <p className={styles.message}>지금은 위로를 기다리는 우유가 없어요</p>
        </div>
      ) : (
        <div data-guide="milk-list">
        <MilkCarousel
          loading={state.status === 'loading'}
          items={items}
          page={guideOpen ? 0 : page}
          onPageChange={onPageChange}
          selectedId={selected}
          onSelect={onSelect}
          onOpen={onOpenConcern}
        />
        </div>
      )}

      <div className={styles.actions}>
        <Button data-guide="reply" disabled={!selected} onClick={() => selected && onOpenConcern(selected)}>
          위로 남기기
        </Button>
      </div>

      <div className={styles.banner} data-guide="write">
        <CheeseBanner title="고민 치즈 남기기" caption="내 치즈는 보관함에 보관돼요" onClick={onWrite} />
      </div>

      <GuideTour open={guideOpen} steps={CHEESE_GUIDE_STEPS} onClose={() => setGuideOpen(false)} />
    </main>
  )
}
