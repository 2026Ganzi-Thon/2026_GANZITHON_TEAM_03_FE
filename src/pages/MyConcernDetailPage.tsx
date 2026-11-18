import { CheeseHeader, ConcernReader, ReceivedReplies, useMyConcernDetail } from '@/features/cheese'
import { BackButton, Button } from '@/shared/ui'
import styles from './MyConcernDetailPage.module.css'

export interface MyConcernDetailPageProps {
  /** 아직 받지 못했으면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  concernId: string
  /** 뒤로가기 — 치즈 보관함으로 */
  onBack?: () => void
  onOpenGuide?: () => void
}

/**
 * 내 고민 상세(치즈 보관함 → "더보기"): 고민 본문 아래에 다른 사람들이 남긴 위로를 보여준다. 시안 117:2179 의 구성에서
 * 위로 작성(치즈 만들기)은 뺐다 — 내 고민에는 위로를 남길 수 없다. 탭바는 없다(고민 상세와 같음).
 */
export default function MyConcernDetailPage({ woolCount, concernId, onBack, onOpenGuide }: MyConcernDetailPageProps) {
  const { state, retry } = useMyConcernDetail(concernId)

  return (
    <main className={styles.page}>
      {/* 임의 결정(확인 필요): 머리 제목은 "내 치즈 보관함" — 시안 117:2179 는 "우유와 치즈"(남의 고민 상세) */}
      <CheeseHeader title="내 치즈 보관함" woolCount={woolCount} onOpenGuide={onOpenGuide} />
      <div className={styles.body}>
        <BackButton className={styles.back} onClick={onBack} />

        {state.status === 'error' ? (
          <div className={styles.error} role="alert">
            <p className={styles.message}>고민을 불러오지 못했어요.</p>
            <Button variant="outline" size="sm" onClick={retry}>
              다시 시도
            </Button>
          </div>
        ) : state.status === 'gone' ? (
          // 임의 결정(확인 필요): 없거나 내 고민이 아닐 때 문구 — 시안 없음
          <p className={styles.message}>고민을 찾을 수 없어요</p>
        ) : (
          <>
            {/* 임의 결정(확인 필요): 작성자 자리는 "나" — 시안은 "익명의 폴리"(남의 고민) */}
            <ConcernReader concern={state.status === 'success' ? state.concern : undefined} authorLabel="나" />
            {state.status === 'success' && <ReceivedReplies state={state.replies} onRetry={retry} />}
          </>
        )}
      </div>
    </main>
  )
}
