import { WoolHistoryList, useWoolHistory } from '@/features/wool-history'
import { getTodaySeoul } from '@/shared/lib/formatRelativeDate'
import { BackButton, Header, WoolCounter } from '@/shared/ui'
import styles from './WoolHistoryPage.module.css'

export interface WoolHistoryPageProps {
  /** 지금 잔액. 아직 받지 못했으면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  onBack?: () => void
}

/**
 * 양털 내역: 받은·돌려준 양털을 날짜별로(최신순, 무한 스크롤). 양털 모으기 화면의 "내 양털" 알약을 눌러 들어온다. 탭바 없음.
 * 임의 결정(확인 필요): 시안이 없어 기록 상세와 같은 머리·뒤로가기 배치로 만들었다. 오른쪽 알약은 지금 잔액(과거 거래의 잔액은 응답에 없다).
 */
export default function WoolHistoryPage({ woolCount, onBack }: WoolHistoryPageProps) {
  const { state, loadMore, retry } = useWoolHistory()

  return (
    <main className={styles.page}>
      <Header title="양털 내역" actions={<WoolCounter count={woolCount} loading={woolCount === undefined} />} />
      <div className={styles.body}>
        <BackButton className={styles.back} onClick={onBack} />
        <WoolHistoryList state={state} today={getTodaySeoul()} onLoadMore={loadMore} onRetry={retry} />
      </div>
    </main>
  )
}
