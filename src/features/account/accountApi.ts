import { ApiError } from '@/shared/api'
import { mockDb, mockDelay } from '@/shared/mock'
import type { InitialProfileRequest, Profile } from './types'

// TODO(API 연결): 본문만 `return api.patch<Profile>('/users/me/initial-profile', body)` 로 바꾸고 `@/shared/mock` import·지연을 지운다.
// (오류는 ApiError code 로 온다: COMMON_INVALID_REQUEST 400, USER_NICKNAME_DUPLICATED 409, USER_INITIAL_PROFILE_ALREADY_COMPLETED 409.)

/**
 * 초기 프로필 설정. `PATCH /api/v1/users/me/initial-profile` 의 `data`(docs/api/account.md).
 * 임의 결정(확인 필요): mock 은 사용자가 한 명뿐이라 이미 설정한 뒤 다시 가입해도 409 없이 덮어쓴다(시연에서 가입을 되풀이하려고).
 */
export async function completeInitialProfile(body: InitialProfileRequest): Promise<Profile> {
  await mockDelay()
  const nickname = body.nickname.trim()
  if (nickname === '') {
    throw new ApiError(400, { code: 'COMMON_INVALID_REQUEST', message: '닉네임을 입력해 주세요.' })
  }
  const user = mockDb.user.completeInitialProfile({
    nickname,
    ageGroup: body.ageGroup ?? null,
    introduction: body.introduction ?? '',
  })
  return {
    userId: '1',
    nickname,
    profileImageUrl: null,
    introduction: user.introduction,
    ageGroup: user.ageGroup,
    regionCode: body.regionCode ?? null,
    profileCompleted: true,
    onboardingCompleted: true,
  }
}
