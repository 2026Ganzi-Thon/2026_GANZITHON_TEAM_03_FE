// 회원 - 계정 API 타입 - docs/api/account.md 기준
import type { IsoDateTime } from './common'

export interface Profile {
  userId: string
  nickname: string
  /** 구글 기본 이미지 등. 업로드 교체는 별도 계약 필요 */
  profileImageUrl: string | null
  /** 소개(최대 200자). 백엔드 기준 아직 쓰지 않았으면 null */
  introduction: string | null
  /** 코드 목록 미정 */
  ageGroup: string | null
  /** 지역 단위·필수 여부 미정 */
  regionCode: string | null
  profileCompleted: boolean
  onboardingCompleted: boolean
}

export type LoginProvider = 'LOCAL' | 'GOOGLE'

/** 내 정보 조회 응답의 data. 초기 설정 전이면 nickname 등이 null로 온다. */
export interface MyInfo extends Omit<Profile, 'nickname'> {
  nickname: string | null
  /** 연락용 이메일. 일반 로그인 ID 변경 권한이 아니다 */
  contactEmail: string
  loginProviders: LoginProvider[]
  createdAt: IsoDateTime
}

/** 내 정보 수정. 포함한 항목만 수정하며 nickname은 null 불가, 나머지는 null이면 제거 */
export interface UpdateProfileRequest {
  nickname?: string
  introduction?: string | null
  ageGroup?: string | null
  regionCode?: string | null
}

/** 초기 프로필 설정. nickname 필수 */
export interface InitialProfileRequest {
  nickname: string
  introduction?: string | null
  ageGroup?: string | null
  regionCode?: string | null
}

export type InitialProfileResponse = Profile

export interface NicknameAvailabilityParams {
  nickname: string
}

export interface NicknameAvailabilityResponse {
  nickname: string
  available: boolean
}

/** completed는 true만 허용 */
export interface OnboardingRequest {
  completed: true
}

export interface OnboardingResponse {
  onboardingCompleted: boolean
  onboardingCompletedAt: IsoDateTime
}

export type ConsentType = 'TERMS' | 'PRIVACY' | 'MARKETING'

export interface ConsentItem {
  consentType: ConsentType
  termsVersion: string
  agreed: boolean
  recordedAt: IsoDateTime
}

export interface ConsentsResponse {
  items: ConsentItem[]
}

export interface MarketingConsentRequest {
  agreed: boolean
  termsVersion: string
}

export interface MarketingConsentResponse extends ConsentItem {
  consentType: 'MARKETING'
}
