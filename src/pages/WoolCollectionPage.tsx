import { useState } from 'react'
import { CARE_GUIDE_ACTIONS, CARE_GUIDE_RECOMMENDED_ID, CARE_GUIDE_STEPS, CareCollection } from '@/features/care'
import { GuideTour } from '@/shared/ui'

export interface WoolCollectionPageProps {
  woolCount: number | undefined
  /** "내 양털" 알약 — 양털 내역으로 */
  onOpenWoolHistory?: () => void
}

export default function WoolCollectionPage({ woolCount, onOpenWoolHistory }: WoolCollectionPageProps) {
  // 오른쪽 위 `!` — 사용법 안내. 안내 중에는 고정 예시 돌봄 목록으로 그린다
  const [guideOpen, setGuideOpen] = useState(false)
  return (
    <>
      <CareCollection
        woolCount={woolCount}
        onOpenWoolHistory={onOpenWoolHistory}
        onOpenGuide={() => setGuideOpen(true)}
        guide={guideOpen ? { actions: CARE_GUIDE_ACTIONS, recommendedId: CARE_GUIDE_RECOMMENDED_ID } : undefined}
      />
      <GuideTour open={guideOpen} steps={CARE_GUIDE_STEPS} onClose={() => setGuideOpen(false)} />
    </>
  )
}
