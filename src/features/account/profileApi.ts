import { api } from '@/shared/api'
import type { MyInfo, NicknameAvailabilityResponse, Profile, UpdateProfileRequest } from './types'

// 설정 화면의 내 정보 조회·수정·닉네임 중복 확인. 응답·오류 코드는 백엔드 MemberProfileController·MemberProfileService·ProfilePatch 기준.
// accountApi.ts(초기 설정)와 나눈 이유: 팀원 브랜치(feature/google-login)가 accountApi.ts 를 맡아서.

export const COMMON_INVALID_REQUEST = 'COMMON_INVALID_REQUEST'
export const USER_NICKNAME_DUPLICATED = 'USER_NICKNAME_DUPLICATED'

/** 내 정보 조회 `GET /api/v1/users/me` 의 `data`. 초기 설정 전이면 nickname 이 null. */
export function fetchMyInfo(): Promise<MyInfo> {
  return api.get<MyInfo>('/users/me')
}

/**
 * 내 정보 수정 `PATCH /api/v1/users/me`. 넣은 항목만 바꾼다(null 이면 지움, nickname 은 null 불가).
 * 오류: 빈 body·모르는 필드·형식 오류 400 `COMMON_INVALID_REQUEST`(fieldErrors 에 항목), 닉네임 중복 409 `USER_NICKNAME_DUPLICATED`.
 */
export function updateMyInfo(body: UpdateProfileRequest): Promise<Profile> {
  return api.patch<Profile>('/users/me', body)
}

/** 닉네임 중복 확인 `GET /api/v1/users/nickname-availability`. 형식 오류는 400, 내 현재 닉네임은 available. 예약이 아니다. */
export function fetchNicknameAvailability(nickname: string): Promise<NicknameAvailabilityResponse> {
  return api.get<NicknameAvailabilityResponse>('/users/nickname-availability', {
    query: { nickname },
  })
}
