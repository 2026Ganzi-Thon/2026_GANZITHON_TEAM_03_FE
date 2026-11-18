import { CheeseHeader, useMyConcerns, VaultCarousel } from '@/features/cheese'
import { BackButton, Button } from '@/shared/ui'
import styles from './CheeseVaultPage.module.css'

export interface CheeseVaultPageProps {
  /** 보유한 양털 개수. 아직 받지 못했으면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  /** 현재 페이지는 상세에 다녀와도 유지되도록 호출하는 쪽이 들고 있다 */
  page: number
  onPageChange: (page: number) => void
  /** 카드의 "더보기" — 내 고민 상세(받은 위로)로 */
  onOpenConcern: (concernId: string) => void
  /** 뒤로가기 화살표 — 우유와 치즈 목록으로 */
  onBack?: () => void
  onOpenGuide?: () => void
}

/** "내 치즈 보관함"(시안 290:636): 내가 쓴 고민을 4개씩 넘겨 보고, "더보기"로 그 고민의 상세(받은 위로)에 간다. */
export default function CheeseVaultPage({ woolCount, page, onPageChange, onOpenConcern, onBack, onOpenGuide }: CheeseVaultPageProps) {
  const { state, retry } = useMyConcerns()

  return (
    <main className={styles.page}>
      <CheeseHeader title="내 치즈 보관함" woolCount={woolCount} onOpenGuide={onOpenGuide} />
      <BackButton className={styles.back} onClick={onBack} />

      {state.status === 'error' ? (
        <div className={styles.status} role="alert">
          <p className={styles.message}>고민을 불러오지 못했어요.</p>
          <Button variant="outline" size="sm" onClick={retry}>
            다시 시도
          </Button>
        </div>
      ) : state.status === 'success' && state.items.length === 0 ? (
        <div className={styles.status}>
          {/* 임의 결정(확인 필요): 빈 목록 안내 문구 — 시안에 없음 */}
          <p className={styles.message}>아직 쓴 고민이 없어요</p>
        </div>
      ) : (
        <VaultCarousel
          loading={state.status === 'loading'}
          items={state.status === 'success' ? state.items : []}
          page={page}
          onPageChange={onPageChange}
          onOpen={onOpenConcern}
        />
      )}
    </main>
  )
}
