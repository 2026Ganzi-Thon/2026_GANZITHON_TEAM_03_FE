import { CheeseHeader, CheeseVaultBanner, MilkCarousel, useConcerns } from '@/features/cheese'
import { Button } from '@/shared/ui'
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
  /** "고민 남기기" — 고민 쓰기로 */
  onWrite?: () => void
  /** "내 치즈 보관함" 배너 */
  onOpenVault?: () => void
  onOpenGuide?: () => void
}

/** "우유와 치즈": 이웃 폴리의 고민(우유병)을 3개씩 넘겨 보고 하나를 골라 위로하러 간다. 내 고민은 "고민 남기기"로 쓴다. */
export default function CheesePage({
  woolCount,
  page,
  onPageChange,
  selectedId,
  onSelect,
  onOpenConcern,
  onWrite,
  onOpenVault,
  onOpenGuide,
}: CheesePageProps) {
  const { state, retry } = useConcerns()
  const items = state.status === 'success' ? state.items : []
  // 목록이 줄어서(위로를 남긴 고민이 빠짐) 선택한 고민이 사라졌으면 선택 없음으로 본다
  const selected = items.some((item) => item.concernId === selectedId) ? selectedId : null

  return (
    <main className={styles.page}>
      <CheeseHeader woolCount={woolCount} onOpenGuide={onOpenGuide} />
      <p className={styles.intro}>
        이웃 폴리의 우유를 골라 답변하고
        <br />
        치즈를 만들어주세요
      </p>

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
        <MilkCarousel
          loading={state.status === 'loading'}
          items={items}
          page={page}
          onPageChange={onPageChange}
          selectedId={selected}
          onSelect={onSelect}
          onOpen={onOpenConcern}
        />
      )}

      <div className={styles.actions}>
        {/* 임의 결정(확인 필요): 고민 쓰기 진입 — 시안에 없어 "위로 남기기"와 같은 줄 왼쪽에 테두리 버튼으로 둔다(줄 높이 그대로) */}
        <Button variant="outline" onClick={onWrite}>
          고민 남기기
        </Button>
        <Button disabled={!selected} onClick={() => selected && onOpenConcern(selected)}>
          위로 남기기
        </Button>
      </div>

      <div className={styles.vault}>
        <CheeseVaultBanner onClick={onOpenVault} />
      </div>
    </main>
  )
}
