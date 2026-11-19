import { CareCollection } from '@/features/care'

export interface WoolCollectionPageProps {
  woolCount: number | undefined
  /** "내 양털" 알약 — 양털 내역으로 */
  onOpenWoolHistory?: () => void
}

export default function WoolCollectionPage({ woolCount, onOpenWoolHistory }: WoolCollectionPageProps) {
  return <CareCollection woolCount={woolCount} onOpenWoolHistory={onOpenWoolHistory} />
}
