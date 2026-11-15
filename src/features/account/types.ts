// 계정(account) 기능 타입. 근거: docs/api/account.md
import type { ConsentItem, ConsentType, MyInfo } from '@/shared/types'

export type {
  ConsentItem,
  ConsentType,
  ConsentsResponse,
  InitialProfileRequest,
  LoginProvider,
  MarketingConsentRequest,
  MarketingConsentResponse,
  MyInfo,
  NicknameAvailabilityParams,
  NicknameAvailabilityResponse,
  OnboardingRequest,
  OnboardingResponse,
  Profile,
  UpdateProfileRequest,
} from '@/shared/types'

/** 초기 프로필 설정·내 정보 수정 폼. 입력창 값이라 비어 있으면 빈 문자열이다. */
export interface ProfileFormValues {
  nickname: string
  introduction: string
  ageGroup: string
  regionCode: string
}

/**
 * 닉네임 중복 확인 결과. 확인은 예약이 아니라서 저장할 때 충돌하면 409(USER_NICKNAME_DUPLICATED)가 온다.
 * 내 현재 닉네임은 `available`이다.
 */
export type NicknameCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available' }
  | { status: 'taken' }
  | { status: 'invalid' }
  | { status: 'error' }

export type MyInfoState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: MyInfo }

/** 약관 종류별 현재 동의 상태. 이력이 없는 종류는 없다. */
export type ConsentStatusMap = Partial<Record<ConsentType, ConsentItem>>
