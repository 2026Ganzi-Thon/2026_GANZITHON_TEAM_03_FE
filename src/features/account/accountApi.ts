import type { InitialProfileRequest, InitialProfileResponse } from '@/shared/types'
import { api } from '@/shared/api'

export function completeInitialProfile(profile: InitialProfileRequest) {
  return api.patch<InitialProfileResponse>('/users/me/initial-profile', profile)
}
