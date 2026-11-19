import { api } from '@/shared/api'
import type { ConsentsResponse, MarketingConsentRequest, MarketingConsentResponse, OnboardingResponse } from './types'

// 약관 동의 조회·마케팅 수신 동의 변경, 온보딩 완료 저장. 응답·오류 코드는 백엔드 기준(develop 6493ad3):
// MemberConsentController·MemberConsentService·ConsentHistory, MemberProfileController.completeOnboarding.

/**
 * 약관별 가장 최근 동의 상태 `GET /users/me/consents` → `{ items }`(TERMS·PRIVACY·MARKETING 순, 이력 없으면 []).
 * 전체 이력이 아니다. 오류는 토큰(401)뿐.
 */
export function fetchConsents(): Promise<ConsentsResponse> {
  return api.get<ConsentsResponse>('/users/me/consents')
}

/**
 * 마케팅 수신 동의 변경 `PATCH /users/me/consents/marketing` `{ agreed, termsVersion }` → 바뀐(또는 같으면 기존) 항목.
 * 이력을 덧붙인다(덮어쓰지 않음). 철회(false)는 서버가 기존 동의 버전으로 기록한다.
 * 오류: 400 COMMON_INVALID_REQUEST(필드가 둘이 아님·빈 버전·50자 초과), 409 CONSENT_VERSION_MISMATCH(동의할 때 버전이 서버 설정과 다름),
 * 404 USER_NOT_FOUND. Idempotency-Key 는 받지 않는다 — 같은 상태 반복은 서버가 기존 결과를 돌려준다.
 */
export function updateMarketingConsent(body: MarketingConsentRequest): Promise<MarketingConsentResponse> {
  return api.patch<MarketingConsentResponse>('/users/me/consents/marketing', body)
}

/**
 * 온보딩 완료 저장 `PATCH /users/me/onboarding` `{ completed: true }`(true 만, 다른 필드 금지) → `{ onboardingCompleted, onboardingCompletedAt }`.
 * 반복 요청은 처음 시각을 그대로 돌려준다. 오류: 400 COMMON_INVALID_REQUEST, 404 USER_NOT_FOUND.
 */
export function completeOnboarding(): Promise<OnboardingResponse> {
  return api.patch<OnboardingResponse>('/users/me/onboarding', { completed: true })
}
