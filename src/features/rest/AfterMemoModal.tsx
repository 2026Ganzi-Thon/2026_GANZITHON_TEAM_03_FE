import { useId, useState } from 'react'
import { Button, Modal, TextField } from '@/shared/ui'
import { AFTER_MEMO_MAX_LENGTH } from './restApi'
import type { RestStatus, SaveAfterMemoState } from './types'
import styles from './AfterMemoModal.module.css'

/** 남은 글자 수를 보여주기 시작하는 길이 */
const COUNTER_FROM = 450

export interface AfterMemoModalProps {
  open: boolean
  /** 끝난 방식 — 제목만 바뀐다 */
  endedStatus: RestStatus
  /** 이미 남긴 메모가 있으면 채워 둔다 */
  initialMemo?: string | null
  state: SaveAfterMemoState
  /** "남기기" — 저장은 쓰는 쪽 몫 */
  onSave: (memo: string) => void
  /** "건너뛰기"·ESC */
  onSkip: () => void
}

function errorMessage(state: SaveAfterMemoState): string | null {
  switch (state.status) {
    case 'invalid':
      return `${AFTER_MEMO_MAX_LENGTH}자 이내로 적어 주세요.`
    case 'not-found':
      return '휴식 기록을 찾지 못했어요. 건너뛰어 주세요.'
    case 'not-ended':
      return '아직 휴식이 끝나지 않았어요.'
    case 'error':
      return '남기지 못했어요. 다시 시도해 주세요.'
    default:
      return null
  }
}

/**
 * 동굴 문이 열린 뒤(정상 완료·중도 종료 모두) 쉬고 난 기분을 한 줄로 남기는 팝업(공용 Modal). 건너뛸 수 있다.
 * 안내·오류·남은 글자 수는 입력 아래 한 줄 자리를 미리 잡아 두어 떠도 버튼이 밀리지 않는다.
 * 임의 결정(확인 필요): 시안이 없어 팝업으로 만들었다. 문구("푹 쉬었어요"·"동굴 문을 열었어요", "쉬고 난 지금 기분을 한 줄로 남겨 볼까요?",
 * 자리 글자, 버튼 "건너뛰기"·"남기기", 오류 문구) 전부 임의.
 */
export function AfterMemoModal({ open, endedStatus, initialMemo, state, onSave, onSkip }: AfterMemoModalProps) {
  const [memo, setMemo] = useState(initialMemo ?? '')
  const formId = useId()
  const saving = state.status === 'saving'
  const error = errorMessage(state)
  const canSave = memo.trim() !== '' && !saving && state.status !== 'not-found'
  const skip = () => {
    if (!saving) onSkip()
  }

  return (
    <Modal
      open={open}
      onClose={skip}
      closeOnBackdrop={false}
      title={endedStatus === 'CANCELLED' ? '동굴 문을 열었어요' : '푹 쉬었어요'}
      footer={
        <>
          <Button variant="outline" size="sm" disabled={saving} onClick={skip}>
            건너뛰기
          </Button>
          <Button type="submit" form={formId} size="sm" disabled={!canSave}>
            남기기
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
          if (canSave) onSave(memo)
        }}
      >
        <p>쉬고 난 지금 기분을 한 줄로 남겨 볼까요?</p>
        <TextField
          label="휴식 후 메모"
          hideLabel
          placeholder="예: 잠깐 쉬니 머리가 맑아졌어요"
          value={memo}
          maxLength={AFTER_MEMO_MAX_LENGTH}
          disabled={saving}
          onChange={(event) => setMemo(event.target.value)}
        />
        {/* 한 줄 자리를 늘 잡아 둔다 */}
        <p className={error ? styles.error : styles.counter} role={error ? 'alert' : undefined} aria-live="polite">
          {error ?? (memo.length >= COUNTER_FROM ? `${AFTER_MEMO_MAX_LENGTH - memo.length}자 남음` : '')}
        </p>
      </form>
    </Modal>
  )
}
