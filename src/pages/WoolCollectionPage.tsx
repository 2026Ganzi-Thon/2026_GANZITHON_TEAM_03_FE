import { CareCollection } from '@/features/care'

export interface WoolCollectionPageProps {
  woolCount: number | undefined
}

export default function WoolCollectionPage({ woolCount }: WoolCollectionPageProps) {
  return <CareCollection woolCount={woolCount} />
}
