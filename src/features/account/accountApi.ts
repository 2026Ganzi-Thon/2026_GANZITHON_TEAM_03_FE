import type { InitialProfileRequest, InitialProfileResponse, NicknameAvailabilityResponse, OnboardingResponse } from '@/shared/types'
import { api } from '@/shared/api'

export function checkNicknameAvailability(nickname: string) {
  return api.get<NicknameAvailabilityResponse>('/users/nickname-availability', {
    query: { nickname },
  })
}

export function completeInitialProfile(profile: InitialProfileRequest) {
  return api.patch<InitialProfileResponse>('/users/me/initial-profile', profile)
}

export function completeOnboarding() {
  return api.patch<OnboardingResponse>('/users/me/onboarding', { completed: true })
}
