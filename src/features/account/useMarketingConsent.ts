import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { NETWORK_ERROR_CODE, TIMEOUT_ERROR_CODE, hasErrorCode, isApiError } from '@/shared/api'
import { consentVersions } from '@/shared/lib/consentVersions'
import { updateMarketingConsent } from './consentApi'
import { accountKeys, consentsQueryOptions } from './profileQueries'
import type { ConsentItem, ConsentsResponse } from './types'

export type ConsentsState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; items: ConsentItem[] }

export type MarketingSaveState =
  | { status: 'idle' }
  | { status: 'saving'; agreed: boolean }
  | { status: 'saved'; agreed: boolean }
  | { status: 'failed'; message: string }

function marketingErrorMessage(error: unknown) {
  if (hasErrorCode(error, 'CONSENT_VERSION_MISMATCH')) {
    return '수신 동의 안내가 바뀌었어요. 앱을 새로고침한 뒤 다시 시도해주세요.'
  }
  if (isApiError(error) && (error.code === NETWORK_ERROR_CODE || error.code === TIMEOUT_ERROR_CODE)) {
    return `바꾸지 못했어요. ${error.message}`
  }
  return '바꾸지 못했어요. 잠시 뒤 다시 시도해주세요.'
}

/** MARKETING 항목만 바꾼 목록(없으면 끝에 붙인다 — 서버 순서도 TERMS·PRIVACY·MARKETING) */
function withMarketing(items: ConsentItem[], next: ConsentItem): ConsentItem[] {
  return items.some((item) => item.consentType === 'MARKETING')
    ? items.map((item) => (item.consentType === 'MARKETING' ? next : item))
    : [...items, next]
}

/**
 * 약관 동의 내역 + 마케팅 수신 동의 토글(낙관적 갱신).
 * 누르면 캐시를 먼저 바꿔 스위치가 바로 움직이고, 실패하면 이전 값으로 되돌린 뒤 안내한다. 응답이 오면 서버 값(기록 시각)으로 고친다.
 * 저장 중에는 스위치를 잠근다 — 앞 요청의 되돌림이 뒤 요청의 낙관 값을 덮지 않게.
 */
export function useMarketingConsent() {
  const queryClient = useQueryClient()
  const { data, isError, refetch } = useQuery(consentsQueryOptions())

  const mutation = useMutation({
    mutationFn: (agreed: boolean) => {
      const latest = queryClient
        .getQueryData<ConsentsResponse>(accountKeys.consents())
        ?.items.find((item) => item.consentType === 'MARKETING')
      // 동의는 지금 앱이 알고 있는 버전으로(서버 설정과 다르면 409), 철회는 서버가 기존 버전으로 기록하지만 빈 값은 안 돼서 아무 버전이나 채운다
      const termsVersion = agreed ? consentVersions.marketingVersion : (latest?.termsVersion ?? consentVersions.marketingVersion)
      return updateMarketingConsent({ agreed, termsVersion })
    },
    onMutate: async (agreed) => {
      await queryClient.cancelQueries({ queryKey: accountKeys.consents() })
      const previous = queryClient.getQueryData<ConsentsResponse>(accountKeys.consents())
      if (previous) {
        const current = previous.items.find((item) => item.consentType === 'MARKETING')
        queryClient.setQueryData<ConsentsResponse>(accountKeys.consents(), {
          items: withMarketing(previous.items, {
            consentType: 'MARKETING',
            termsVersion: current?.termsVersion ?? consentVersions.marketingVersion,
            agreed,
            // 기록 시각은 응답이 오면 서버 값으로 바뀐다
            recordedAt: current?.recordedAt ?? new Date().toISOString(),
          }),
        })
      }
      return { previous }
    },
    onError: (_error, _agreed, context) => {
      if (context?.previous) queryClient.setQueryData(accountKeys.consents(), context.previous)
    },
    onSuccess: (entry) => {
      queryClient.setQueryData<ConsentsResponse>(accountKeys.consents(), (old) =>
        old ? { items: withMarketing(old.items, entry) } : { items: [entry] },
      )
    },
  })

  const state: ConsentsState = data ? { status: 'success', items: data.items } : isError ? { status: 'error' } : { status: 'loading' }

  const save: MarketingSaveState =
    mutation.status === 'pending'
      ? { status: 'saving', agreed: mutation.variables }
      : mutation.status === 'success'
        ? { status: 'saved', agreed: mutation.data.agreed }
        : mutation.status === 'error'
          ? { status: 'failed', message: marketingErrorMessage(mutation.error) }
          : { status: 'idle' }

  return {
    state,
    save,
    retry: () => void refetch(),
    setMarketing: (agreed: boolean) => {
      if (!mutation.isPending) mutation.mutate(agreed)
    },
  }
}
