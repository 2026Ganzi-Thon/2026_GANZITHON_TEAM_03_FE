import type { ReactNode } from 'react'
import {
  CheeseHeader,
  toMyVaultCards,
  toSavedVaultCards,
  useMyConcerns,
  useSavedConcerns,
  VaultCarousel,
} from '@/features/cheese'
import type { CheeseTab, VaultCardItem } from '@/features/cheese'
import sheepSadImage from '@/assets/images/sheep-sad.webp'
import { BackButton, Button, EmptyState, Tabs } from '@/shared/ui'
import styles from './CheeseVaultPage.module.css'

export interface CheeseVaultPageProps {
  /** 보유한 양털 개수. 아직 받지 못했으면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  /** 지금 탭과 페이지는 상세에 다녀와도 유지되도록 호출하는 쪽이 들고 있다 */
  tab: CheeseTab
  onTabChange: (tab: CheeseTab) => void
  page: number
  onPageChange: (page: number) => void
  /** 카드의 "더보기" — 내 고민 상세(받은 위로)로 */
  onOpenConcern: (concernId: string) => void
  /** 빈 "내 고민" 탭의 "고민 남기기" — 고민 쓰기로 */
  onWrite?: () => void
  /** 뒤로가기 화살표 — 우유와 치즈 목록으로 */
  onBack?: () => void
  onOpenGuide?: () => void
}

// 임의 결정(확인 필요): 시안(290:636)은 목록 하나뿐이지만, API 가 "내 고민 전체"(숙성 중 포함)와 "보관한 치즈"를 따로 줘서 탭 두 개로 나눈다.
// 숙성 중·숙성 끝 치즈는 "내 고민"에만 있어 기본 탭은 "내 고민"(홈 숙성 치즈 알림도 이 탭으로 온다)
const TABS: { value: CheeseTab; label: string }[] = [
  { value: 'mine', label: '내 고민' },
  { value: 'saved', label: '보관한 치즈' },
]

/** "내 치즈 보관함"(시안 290:636): 내 고민·보관한 치즈 탭, 카드를 4개씩 넘겨 보고 "더보기"로 그 고민의 상세(받은 위로)에 간다. */
export default function CheeseVaultPage({
  woolCount,
  tab,
  onTabChange,
  page,
  onPageChange,
  onOpenConcern,
  onWrite,
  onBack,
  onOpenGuide,
}: CheeseVaultPageProps) {
  return (
    <main className={styles.page}>
      <CheeseHeader title="내 치즈 보관함" woolCount={woolCount} onOpenGuide={onOpenGuide} />
      <BackButton className={styles.back} onClick={onBack} />
      <Tabs
        className={styles.tabs}
        aria-label="치즈 보관함 목록"
        items={TABS}
        value={tab}
        onChange={(value) => onTabChange(value as CheeseTab)}
      />
      <div role="tabpanel" className={styles.panel} aria-label={TABS.find((item) => item.value === tab)?.label}>
        {tab === 'mine' ? (
          <MyConcernList page={page} onPageChange={onPageChange} onOpen={onOpenConcern} onWrite={onWrite} />
        ) : (
          <SavedConcernList page={page} onPageChange={onPageChange} onOpen={onOpenConcern} />
        )}
      </div>
    </main>
  )
}

interface ListProps {
  page: number
  onPageChange: (page: number) => void
  onOpen: (concernId: string) => void
}

function MyConcernList({ onWrite, ...rest }: ListProps & { onWrite?: () => void }) {
  const { state, retry } = useMyConcerns()
  return (
    <VaultList
      {...rest}
      state={state.status === 'success' ? { status: 'success', items: toMyVaultCards(state.items) } : state}
      onRetry={retry}
      // 임의 결정(확인 필요): 빈 목록 안내 — 시안에 없음. 캐릭터 시트의 우는 양 얼굴(SAD)을 오려 쓰고, 설명은 우유와 치즈 시안 문구를 따른다
      empty={
        <EmptyState
          image={sheepSadImage}
          title="아직 쓴 고민이 없어요"
          description="나누고 싶은 고민을 남기면 다른 섬의 누군가가 천천히 위로를 더해요."
          action={
            onWrite && (
              <Button variant="outline" size="sm" onClick={onWrite}>
                고민 남기기
              </Button>
            )
          }
        />
      }
    />
  )
}

function SavedConcernList(props: ListProps) {
  const { state, retry } = useSavedConcerns()
  return (
    <VaultList
      {...props}
      state={state.status === 'success' ? { status: 'success', items: toSavedVaultCards(state.items) } : state}
      onRetry={retry}
      // 임의 결정(확인 필요): 빈 보관함 안내 — 시안에 없음. 내 고민 탭과 같은 우는 양
      empty={
        <EmptyState
          image={sheepSadImage}
          title="보관한 치즈가 없어요"
          description="개봉한 치즈를 보관하면 여기에 모여요."
        />
      }
    />
  )
}

type VaultListState = { status: 'loading' } | { status: 'error' } | { status: 'success'; items: VaultCardItem[] }

function VaultList({
  state,
  onRetry,
  empty,
  page,
  onPageChange,
  onOpen,
}: ListProps & { state: VaultListState; onRetry: () => void; empty: ReactNode }) {
  if (state.status === 'error') {
    return (
      <div className={styles.status} role="alert">
        <p className={styles.message}>고민을 불러오지 못했어요.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    )
  }
  if (state.status === 'success' && state.items.length === 0) {
    return <div className={styles.status}>{empty}</div>
  }
  return (
    <VaultCarousel
      loading={state.status === 'loading'}
      items={state.status === 'success' ? state.items : []}
      page={page}
      onPageChange={onPageChange}
      onOpen={onOpen}
    />
  )
}
