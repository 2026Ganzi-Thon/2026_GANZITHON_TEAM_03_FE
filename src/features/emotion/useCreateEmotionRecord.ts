import { useState } from 'react'
import { hasErrorCode } from '@/shared/api'
import { EMOTION_RECORD_ALREADY_EXISTS, createEmotionRecord } from './emotionApi'
import type { EmotionFormValues, EmotionRecord } from './types'

export type CreateEmotionRecordState =
  | { status: 'idle' }
  | { status: 'submitting' }
  /** 오늘 이미 기록함(409) */
  | { status: 'already-exists' }
  | { status: 'error' }
  | { status: 'success'; record: EmotionRecord }

/** 오늘의 감정 기록을 저장한다. 저장 성공 뒤의 연출·이동은 쓰는 쪽 몫이다. */
export function useCreateEmotionRecord() {
  const [state, setState] = useState<CreateEmotionRecordState>({ status: 'idle' })

  const submit = async ({ emotionIds, memo }: EmotionFormValues) => {
    if (state.status === 'submitting') return
    setState({ status: 'submitting' })

    try {
      const record = await createEmotionRecord({ emotionIds, memo: memo.trim() === '' ? null : memo })
      setState({ status: 'success', record })
    } catch (error) {
      setState({ status: hasErrorCode(error, EMOTION_RECORD_ALREADY_EXISTS) ? 'already-exists' : 'error' })
    }
  }

  return { state, submit }
}
