import {
  EmotionHeader,
  EmotionRecordList,
  SheepHero,
  useEmotionRecords,
  usePrefetchEmotions,
} from '@/features/emotion'
import type { EmotionRecordRow } from '@/features/emotion'
import { getTodaySeoul } from '@/shared/lib/formatRelativeDate'
import { Button } from '@/shared/ui'
import styles from './EmotionPage.module.css'

export interface EmotionPageProps {
  /** 보유한 양털 개수. care 기능 소관이라 호출하는 쪽이 넘긴다 */
  woolCount: number
  /** "먹이주기" — 작성 화면으로 */
  onOpenWrite?: () => void
  /** 기록 행을 눌렀을 때 — 그 기록의 상세 화면으로 */
  onOpenRecord?: (recordId: string) => void
  onOpenGuide?: () => void
}

/** "양 먹이주기": 양 일러스트, 먹이주기 버튼, 지난 기록과 지푸라기(메모) 목록. 이동은 props 콜백으로 받는다. */
export default function EmotionPage({ woolCount, onOpenWrite, onOpenRecord, onOpenGuide }: EmotionPageProps) {
  const { state, retry } = useEmotionRecords()
  // 먹이주기 버튼을 누르기 전에 감정 목록을 받아 둬서 작성 화면에서 칩이 바로 보이게 한다
  usePrefetchEmotions()
  const today = getTodaySeoul()

  const records = state.status === 'success' ? state.records : []
  const recordedToday = records.some((record) => record.recordDate === today)

  // 임의 결정(확인 필요): 두 목록의 역할 — 둘의 차이가 명세에 없다(기획 확인 전)
  // "지난 먹이주기 기록"은 모든 기록을 감정 이름("기쁨, 평온")으로, "내 지푸라기들"은 메모가 있는 기록만 메모로 보여준다.
  // 같은 메모가 두 목록에 똑같이 두 번 나오지 않게 나눴다. 두 목록 모두 행을 누르면 상세로 간다.
  const pastRows: EmotionRecordRow[] = records.map((record) => ({
    id: record.recordId,
    text: [...record.emotions]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((emotion) => emotion.name)
      .join(', '),
    date: record.recordDate,
  }))
  const strawRows: EmotionRecordRow[] = records
    .filter((record) => record.memo)
    .map((record) => ({ id: record.recordId, text: record.memo ?? '', date: record.recordDate }))

  return (
    <main className={styles.page}>
      <EmotionHeader woolCount={woolCount} onOpenGuide={onOpenGuide} />
      <div className={styles.body}>
        <SheepHero />

        <div className={styles.feed}>
          <p className={styles.prompt}>
            오늘의 감정을 입력해서
            <br />내 양들에게 먹이를 주세요
          </p>
          {/* 임의 결정(확인 필요): 오늘 이미 기록했으면 "오늘 먹이를 줬어요"(비활성)로 바꾼다 — 수정은 2차 */}
          <Button
            className={styles.feedButton}
            disabled={state.status !== 'success' || recordedToday}
            onClick={onOpenWrite}
          >
            {recordedToday ? '오늘 먹이를 줬어요' : '먹이주기'}
          </Button>
        </div>

        <EmotionRecordList
          title="지난 먹이주기 기록"
          status={state.status}
          rows={pastRows}
          today={today}
          emptyText="아직 먹이를 준 기록이 없어요."
          onRetry={retry}
          onSelect={onOpenRecord}
        />
        <EmotionRecordList
          title="내 지푸라기들"
          status={state.status}
          rows={strawRows}
          today={today}
          emptyText="아직 남긴 지푸라기가 없어요."
          onRetry={retry}
          onSelect={onOpenRecord}
        />
      </div>
    </main>
  )
}
