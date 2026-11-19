import { Button, Modal } from '@/shared/ui'
import type { CancelRestSessionState } from './types'
import styles from './CaveOpenModal.module.css'

export interface CaveOpenModalProps {
  open: boolean
  /** 휴대폰을 들어서 저절로 뜬 것인지 — 다시 눕히면 계속 쉴 수 있다고 알려 준다 */
  lifted?: boolean
  state: CancelRestSessionState
  onConfirm: () => void
  onClose: () => void
}

/**
 * "동굴 문 열기"를 눌렀을 때의 확인(공용 Modal). 끝내는 동안은 두 버튼 모두 막는다.
 * 휴대폰을 들면 저절로 뜨고(`lifted`), 다시 눕히면 쓰는 쪽이 닫는다.
 * 임의 결정(확인 필요): 문구("동굴 문을 열까요?", "지금 열면 이번 휴식은 여기서 끝나요.", 들었을 때 "휴대폰을 다시 눕히면 계속 쉴 수 있어요.", 버튼 "계속 쉬기"·"문 열기", 실패 문구) — 시안 없음
 */
export function CaveOpenModal({ open, lifted = false, state, onConfirm, onClose }: CaveOpenModalProps) {
  const cancelling = state.status === 'cancelling'
  const close = () => {
    if (!cancelling) onClose()
  }

  return (
    <Modal
      open={open}
      onClose={close}
      closeOnBackdrop={!cancelling}
      title="동굴 문을 열까요?"
      footer={
        <>
          <Button variant="outline" size="sm" disabled={cancelling} onClick={close}>
            계속 쉬기
          </Button>
          <Button size="sm" disabled={cancelling} onClick={onConfirm}>
            문 열기
          </Button>
        </>
      }
    >
      {state.status === 'error' ? (
        <p className={styles.warning} role="alert">
          문을 열지 못했어요. 잠시 후 다시 시도해 주세요.
        </p>
      ) : (
        <p>
          {lifted && '휴대폰을 다시 눕히면 계속 쉴 수 있어요. '}
          지금 열면 이번 휴식은 여기서 끝나요.
        </p>
      )}
    </Modal>
  )
}
