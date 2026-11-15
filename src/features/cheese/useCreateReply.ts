import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hasErrorCode } from '@/shared/api'
import {
  CONCERN_NOT_FOUND,
  CONCERN_REPLY_CLOSED,
  REPLY_ALREADY_EXISTS,
  REPLY_OWN_CONCERN_FORBIDDEN,
  createReply,
} from './cheeseApi'
import { removeConcernFromList } from './cheeseQueries'

export type CreateReplyState =
  | { status: 'idle' }
  | { status: 'submitting' }
  /** 작성 완료. 이미 남긴 위로(409 REPLY_ALREADY_EXISTS)도 완료로 취급한다 */
  | { status: 'success' }
  /** 이미 마감됐거나 사라진 고민(409 CONCERN_REPLY_CLOSED · 404 CONCERN_NOT_FOUND) */
  | { status: 'closed' }
  /** 자기 고민(403) */
  | { status: 'forbidden' }
  | { status: 'error' }

/** 위로를 남긴다. 남겼거나 마감된 고민은 목록 캐시에서 빼고, 뒤의 안내·이동은 쓰는 쪽 몫이다. */
export function useCreateReply(concernId: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (content: string) => createReply(concernId, { content }),
    onSuccess: () => removeConcernFromList(queryClient, concernId),
    onError: (error) => {
      if (
        hasErrorCode(error, REPLY_ALREADY_EXISTS) ||
        hasErrorCode(error, CONCERN_REPLY_CLOSED) ||
        hasErrorCode(error, CONCERN_NOT_FOUND)
      ) {
        removeConcernFromList(queryClient, concernId)
      }
    },
  })

  const state: CreateReplyState =
    mutation.status === 'pending'
      ? { status: 'submitting' }
      : mutation.status === 'success'
        ? { status: 'success' }
        : mutation.status === 'error'
          ? hasErrorCode(mutation.error, REPLY_ALREADY_EXISTS)
            ? { status: 'success' }
            : hasErrorCode(mutation.error, CONCERN_REPLY_CLOSED) || hasErrorCode(mutation.error, CONCERN_NOT_FOUND)
              ? { status: 'closed' }
              : hasErrorCode(mutation.error, REPLY_OWN_CONCERN_FORBIDDEN)
                ? { status: 'forbidden' }
                // TODO(서버 검열): 서버가 비속어로 거절하는 오류 코드가 정해지면 여기서 { status: 'profane' } 같은 상태로
                // 나눠 ReplyForm의 비속어 안내(입력창 아래)를 같이 쓴다. 코드 미정(docs/api/cheese.md "미결정: 검열")이라 비워 둠
                : { status: 'error' }
          : { status: 'idle' }

  const submit = async (content: string) => {
    if (mutation.isPending) return
    try {
      await mutation.mutateAsync(content.trim())
    } catch {
      // 오류는 mutation 상태로 노출된다
    }
  }

  return { state, submit }
}
