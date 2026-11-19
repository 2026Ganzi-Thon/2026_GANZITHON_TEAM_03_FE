import { useState } from 'react'
import { CARE_GUIDE_ACTIONS, CARE_GUIDE_RECOMMENDED_ID, CARE_GUIDE_STEPS, CareCollection } from '@/features/care'
import { GuideNudge, GuideTour } from '@/shared/ui'
import { hasSeenGuide, markGuideSeen } from '@/shared/lib/guideSeen'

export interface WoolCollectionPageProps {
  woolCount: number | undefined
  /** "내 양털" 알약 — 양털 내역으로 */
  onOpenWoolHistory?: () => void
}

export default function WoolCollectionPage({ woolCount, onOpenWoolHistory }: WoolCollectionPageProps) {
  // 오른쪽 위 `!` — 사용법 안내. 안내 중에는 고정 예시 돌봄 목록으로 그린다
  const [guideOpen, setGuideOpen] = useState(false)
  // 이 기기에서 이 화면에 처음 들어왔으면 `!` 아래에 "처음이신가요?" 말풍선(화면마다 한 번, 뜬 순간 본 것으로 기억)
  const [nudgeOpen, setNudgeOpen] = useState(() => !hasSeenGuide('wool'))
  const openGuide = () => {
    setNudgeOpen(false)
    setGuideOpen(true)
  }
  return (
    <>
      <CareCollection
        woolCount={woolCount}
        onOpenWoolHistory={onOpenWoolHistory}
        onOpenGuide={openGuide}
        guide={guideOpen ? { actions: CARE_GUIDE_ACTIONS, recommendedId: CARE_GUIDE_RECOMMENDED_ID } : undefined}
      />
      <GuideNudge
        open={nudgeOpen && !guideOpen}
        target="guide-button"
        onOpen={openGuide}
        onDismiss={() => setNudgeOpen(false)}
        onShown={() => markGuideSeen('wool')}
      />
      <GuideTour open={guideOpen} steps={CARE_GUIDE_STEPS} onClose={() => setGuideOpen(false)} />
    </>
  )
}
