import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode, isOutcomeUnknown, newIdempotencyKey } from '@/shared/api'
import { COMMON_INVALID_REQUEST, createConcern } from './cheeseApi'
import { cheeseKeys } from './cheeseQueries'
import type { ComfortType, ConcernDetail, CreateConcernResponse, MyConcernListResponse } from './types'

export type CreateConcernState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; concern: CreateConcernResponse }
  /** 서버가 내용을 거절함(400 — 제목·내용 길이, 제목의 줄바꿈·제어 문자, 위로 방식). 화면에서 먼저 막아서 보통은 오지 않는다 */
  | { status: 'invalid' }
  | { status: 'error' }

interface CreateConcernInput {
  title: string
  content: string
  comfortType: ComfortType
}

/** 서버 미리보기와 같은 규칙: 앞 100자(코드 포인트) */
const toPreview = (content: string) => Array.from(content).slice(0, 100).join('')

/**
 * 고민을 쓰고 숙성을 시작한다. `Idempotency-Key` 는 같은 내용으로 다시 보내는 동안 같은 키를 쓴다 —
 * 응답을 못 받은 실패(네트워크·시간 초과·5xx·잠금 충돌 COMMON_STATE_CONFLICT)는 서버에 저장됐을 수 있어서, 같은 키로 보내면 서버가 처음 응답을 돌려준다(중복 작성 없음).
 * 제목·내용·위로 방식을 고치면 새 키(같은 키·다른 본문은 409). 성공했거나 서버가 처리하지 않은 게 확실한 실패(키 충돌 409 등 4xx)면 키를 버린다.
 * 성공하면 새 고민을 내 고민 목록과 상세 캐시에 바로 넣는다(보관함·상세가 스켈레톤 없이 보이게). 홈 요약은 app/queryClient.ts 공통 규칙이 다시 받는다.
 */
export function useCreateConcern() {
  const queryClient = useQueryClient()
  const keyRef = useRef<{ fingerprint: string; key: string } | null>(null)

  const takeKey = (input: CreateConcernInput) => {
    const fingerprint = JSON.stringify([input.title, input.content, input.comfortType])
    if (keyRef.current?.fingerprint !== fingerprint) keyRef.current = { fingerprint, key: newIdempotencyKey() }
    return keyRef.current.key
  }

  const mutation = useMutation({
    mutationFn: (input: CreateConcernInput) => createConcern(input, takeKey(input)),
    onSuccess: (created, input) => {
      keyRef.current = null
      const detail: ConcernDetail = {
        concernId: created.concernId,
        title: input.title,
        content: input.content,
        comfortType: input.comfortType,
        createdAt: created.createdAt,
        mine: true,
        status: created.status,
        maturesAt: created.maturesAt,
        replyable: false,
        alreadyReplied: false,
      }
      queryClient.setQueryData(cheeseKeys.concern(created.concernId), detail)
      queryClient.setQueryData(cheeseKeys.myConcerns(), (old?: MyConcernListResponse) =>
        old && old.items.every((item) => item.concernId !== created.concernId)
          ? {
              ...old,
              items: [
                {
                  concernId: created.concernId,
                  title: input.title,
                  preview: toPreview(input.content),
                  comfortType: input.comfortType,
                  status: created.status,
                  maturesAt: created.maturesAt,
                  openedAt: null,
                  createdAt: created.createdAt,
                },
                ...old.items,
              ],
            }
          : old,
      )
      void queryClient.invalidateQueries({ queryKey: cheeseKeys.myConcerns() })
    },
    onError: (error) => {
      // 서버가 처리했는지 모르는 실패만 같은 키를 남긴다(같은 내용으로 다시 보내면 처음 응답이 온다). 키 충돌(409)·형식 오류 등은 새 키로
      if (!isOutcomeUnknown(error)) keyRef.current = null
    },
  })

  const state: CreateConcernState =
    mutation.status === 'pending'
      ? { status: 'submitting' }
      : mutation.status === 'success'
        ? { status: 'success', concern: mutation.data }
        : mutation.status === 'error'
          ? hasErrorCode(mutation.error, COMMON_INVALID_REQUEST)
            ? { status: 'invalid' }
            : { status: 'error' }
          : { status: 'idle' }

  /** 보내고 만든 고민을 돌려준다. 보내는 중이면 무시하고, 실패하면 null(내용은 `state` 로 본다). */
  const submit = async (input: CreateConcernInput): Promise<CreateConcernResponse | null> => {
    if (mutation.isPending) return null
    try {
      return await mutation.mutateAsync({
        title: input.title.trim(),
        content: input.content.trim(),
        comfortType: input.comfortType,
      })
    } catch {
      return null
    }
  }

  return { state, submit }
}
