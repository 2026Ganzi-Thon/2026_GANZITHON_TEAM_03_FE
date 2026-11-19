import { useState } from 'react'
import {
  EMOTION_GUIDE_STEPS,
  EmotionHeader,
  EmotionRecordList,
  SheepHero,
  emotionGuideRows,
  useEmotionRecords,
  usePrefetchEmotions,
} from '@/features/emotion'
import type { EmotionRecordRow } from '@/features/emotion'
import { getTodaySeoul } from '@/shared/lib/formatRelativeDate'
import { Button, GuideTour } from '@/shared/ui'
import styles from './EmotionPage.module.css'

export interface EmotionPageProps {
  /** 보유한 양털 개수. care 기능 소관이라 호출하는 쪽이 넘긴다 */
  /** 아직 받지 못했으면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  /** "먹이주기" — 작성 화면으로 */
  onOpenWrite?: () => void
  /** 기록 행을 눌렀을 때 — 그 기록의 상세 화면으로 */
  onOpenRecord?: (recordId: string) => void
}

/** "양 먹이주기": 양 일러스트, 먹이주기 버튼, 지난 먹이주기 기록 목록. 이동은 props 콜백으로 받는다. */
export default function EmotionPage({ woolCount, onOpenWrite, onOpenRecord }: EmotionPageProps) {
  const { state, retry } = useEmotionRecords()
  // 먹이주기 버튼을 누르기 전에 감정 목록을 받아 둬서 작성 화면에서 칩이 바로 보이게 한다
  usePrefetchEmotions()
  const today = getTodaySeoul()
  // 오른쪽 위 `!` — 사용법 안내. 안내 중에는 고정 예시 기록으로 그린다(화살표가 늘 같은 자리를 가리키게)
  const [guideOpen, setGuideOpen] = useState(false)

  const records = state.status === 'success' ? state.records : []
  const recordedToday = records.some((record) => record.recordDate === today)

  // 기록마다 그날의 감정 이름("기쁨, 평온")을 보여주고, 누르면 상세(메모 포함)로 간다.
  // 시안의 "내 지푸라기들"(메모 목록)은 같은 기록을 다시 보여줘서 뺐다 — 사용자 요청(2026-11-19)
  const pastRows: EmotionRecordRow[] = records.map((record) => ({
    id: record.recordId,
    text: [...record.emotions]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((emotion) => emotion.name)
      .join(', '),
    date: record.recordDate,
  }))
  const rows = guideOpen ? emotionGuideRows(today) : pastRows
  const listStatus = guideOpen ? 'success' : state.status

  return (
    <main className={styles.page}>
      <EmotionHeader woolCount={woolCount} onOpenGuide={() => setGuideOpen(true)} />
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
            data-guide="feed"
            disabled={!guideOpen && (state.status !== 'success' || recordedToday)}
            onClick={onOpenWrite}
          >
            {recordedToday && !guideOpen ? '오늘 먹이를 줬어요' : '먹이주기'}
          </Button>
        </div>

        <div data-guide="records">
        <EmotionRecordList
          title="지난 먹이주기 기록"
          status={listStatus}
          rows={rows}
          today={today}
          emptyText="아직 먹이를 준 기록이 없어요."
          onRetry={retry}
          onSelect={onOpenRecord}
        />
        </div>
      </div>

      <GuideTour open={guideOpen} steps={EMOTION_GUIDE_STEPS} onClose={() => setGuideOpen(false)} />
    </main>
  )
}
