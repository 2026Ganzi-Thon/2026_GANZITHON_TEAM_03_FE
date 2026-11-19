import { queryOptions } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { fetchConsents } from './consentApi'
import { fetchMyInfo, fetchNicknameAvailability } from './profileApi'
import type { MyInfo, Profile } from './types'

export const accountKeys = {
  all: ['account'] as const,
  me: () => [...accountKeys.all, 'me'] as const,
  nicknameAvailability: (nickname: string) => [...accountKeys.all, 'nicknameAvailability', nickname] as const,
  consents: () => [...accountKeys.all, 'consents'] as const,
}

/** 내 정보. 다른 화면(초기 설정)에서 바뀔 수 있어 들어올 때마다 뒤에서 다시 받는다(staleTime 기본 0). */
export const myInfoQueryOptions = () =>
  queryOptions({
    queryKey: accountKeys.me(),
    queryFn: fetchMyInfo,
  })

/** 닉네임 중복 확인. 버튼을 누를 때만 받고 결과는 남겨 두지 않는다(예약이 아니라 그때의 결과). 형식 오류(400)는 재시도하지 않는다. */
export const nicknameAvailabilityQueryOptions = (nickname: string) =>
  queryOptions({
    queryKey: accountKeys.nicknameAvailability(nickname),
    queryFn: () => fetchNicknameAvailability(nickname),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  })

/** 수정 응답(Profile)을 내 정보 캐시에 바로 반영한다. */
export function applyProfile(queryClient: QueryClient, profile: Profile): void {
  queryClient.setQueryData(accountKeys.me(), (old?: MyInfo) => (old ? { ...old, ...profile } : old))
}

/** 약관 동의 내역(설정 화면). 마케팅 동의를 바꾸면 응답으로 바로 고친다 */
export const consentsQueryOptions = () =>
  queryOptions({
    queryKey: accountKeys.consents(),
    queryFn: fetchConsents,
  })
