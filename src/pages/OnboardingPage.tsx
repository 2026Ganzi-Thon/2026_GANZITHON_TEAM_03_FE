import { OnboardingScreen } from '@/features/onboarding'

export interface OnboardingPageProps {
  onComplete: () => void
}

export default function OnboardingPage({ onComplete }: OnboardingPageProps) {
  return <OnboardingScreen onComplete={onComplete} />
}
