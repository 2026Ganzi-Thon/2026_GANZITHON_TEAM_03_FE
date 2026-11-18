import { ApiError } from '@/shared/api'
import { mockDb, mockDelay } from '@/shared/mock'
import { isValidNickname, normalizeNickname } from './nickname'
import type { MyInfo, NicknameAvailabilityResponse, Profile, UpdateProfileRequest } from './types'

// 설정 화면의 내 정보 조회·수정·닉네임 중복 확인(docs/api/account.md 1·2·4번). 지금은 가짜 DB(`@/shared/mock`)의 user 를 읽고 쓴다.
// accountApi.ts 와 나눈 이유: 팀원 브랜치(feature/google-login)가 accountApi.ts 를 실제 API 로 바꾸는 중이라 충돌을 피하려고.
// API 를 붙일 때 각 함수 본문을 위의 TODO 한 줄로 바꾸고 `@/shared/mock` import 를 지운다.

export const COMMON_INVALID_REQUEST = 'COMMON_INVALID_REQUEST'
export const USER_NICKNAME_DUPLICATED = 'USER_NICKNAME_DUPLICATED'

/**
 * 임의 결정(확인 필요): 다른 사람이 이미 쓰는 닉네임(가짜). 지금 내 닉네임은 여기 있어도 사용 가능으로 본다(명세 4번 메모).
 * 그래서 시드 닉네임 "온기"에서 바꾼 뒤에는 "온기"도 이미 사용 중으로 나온다 — 가짜 DB 사용자가 한 명뿐이라 생기는 일.
 */
const TAKEN_NICKNAMES = ['온기', '폴리', '양털']

// 임의 결정(확인 필요): 가짜 DB 에 없는 값(이메일·로그인 수단·가입 시각)은 고정값
const MOCK_CONTACT_EMAIL = 'polly@example.com'
const MOCK_CREATED_AT = '2026-11-01T00:00:00Z'

function isTaken(nickname: string): boolean {
  const mine = mockDb.user.get().nickname
  return nickname !== mine && TAKEN_NICKNAMES.includes(nickname)
}

function invalid(message: string): ApiError {
  return new ApiError(400, { code: COMMON_INVALID_REQUEST, message })
}

function toProfile(): Profile {
  const user = mockDb.user.get()
  return {
    userId: '1',
    nickname: user.nickname ?? '',
    profileImageUrl: null,
    introduction: user.introduction,
    ageGroup: user.ageGroup,
    // 가짜 DB 에 지역이 없다
    regionCode: null,
    profileCompleted: user.profileCompleted,
    onboardingCompleted: true,
  }
}

// TODO(API 연결): return api.get<MyInfo>('/users/me')
/** 내 정보 조회 `GET /api/v1/users/me` 의 `data`. 초기 설정 전이면 nickname 이 null. */
export async function fetchMyInfo(): Promise<MyInfo> {
  await mockDelay()
  const user = mockDb.user.get()
  return {
    ...toProfile(),
    nickname: user.nickname,
    contactEmail: MOCK_CONTACT_EMAIL,
    loginProviders: ['GOOGLE'],
    createdAt: MOCK_CREATED_AT,
  }
}

// TODO(API 연결): return api.patch<Profile>('/users/me', body)
/**
 * 내 정보 수정 `PATCH /api/v1/users/me`. 넣은 항목만 바꾼다.
 * 오류: 빈 body·형식 오류 400 `COMMON_INVALID_REQUEST`, 닉네임 중복 409 `USER_NICKNAME_DUPLICATED`.
 */
export async function updateMyInfo(body: UpdateProfileRequest): Promise<Profile> {
  await mockDelay()
  const patch: Parameters<typeof mockDb.user.update>[0] = {}

  if (Object.keys(body).length === 0) throw invalid('바꿀 항목이 없어요.')
  if ('nickname' in body) {
    if (typeof body.nickname !== 'string' || !isValidNickname(body.nickname)) {
      throw invalid('닉네임 형식이 올바르지 않아요.')
    }
    const nickname = normalizeNickname(body.nickname)
    if (isTaken(nickname)) {
      throw new ApiError(409, { code: USER_NICKNAME_DUPLICATED, message: '이미 사용 중인 닉네임이에요.' })
    }
    patch.nickname = nickname
  }
  if ('ageGroup' in body) patch.ageGroup = body.ageGroup ?? null
  if ('introduction' in body) {
    const introduction = body.introduction ?? ''
    if (introduction.length > 200) throw invalid('소개는 200자까지 쓸 수 있어요.')
    patch.introduction = introduction
  }
  // regionCode 는 가짜 DB 에 자리가 없어 받기만 하고 버린다

  mockDb.user.update(patch)
  return toProfile()
}

// TODO(API 연결): return api.get<NicknameAvailabilityResponse>('/users/nickname-availability', { query: { nickname } })
/** 닉네임 중복 확인 `GET /api/v1/users/nickname-availability`. 형식 오류는 400, 내 현재 닉네임은 available. 예약이 아니다. */
export async function fetchNicknameAvailability(nickname: string): Promise<NicknameAvailabilityResponse> {
  await mockDelay()
  if (!isValidNickname(nickname)) throw invalid('닉네임 형식이 올바르지 않아요.')
  const normalized = normalizeNickname(nickname)
  return { nickname: normalized, available: !isTaken(normalized) }
}
