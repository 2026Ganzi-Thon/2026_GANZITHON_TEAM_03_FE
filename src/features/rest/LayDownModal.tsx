import { Button, Modal } from '@/shared/ui'
import styles from './LayDownModal.module.css'

export interface LayDownModalProps {
  open: boolean
  onCancel: () => void
}

/**
 * "동굴 문 닫기"를 누른 뒤 휴대폰을 바닥에 눕히길 기다리는 안내(공용 Modal). 눕히면 쓰는 쪽이 닫고 휴식을 시작한다.
 * 임의 결정(확인 필요): 문구("휴대폰을 바닥에 눕혀보세요!", 안내 한 줄, "취소") — 시안 없음. 제목은 사용자 제안 문구
 */
export function LayDownModal({ open, onCancel }: LayDownModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="휴대폰을 바닥에 눕혀보세요!"
      footer={
        <Button variant="outline" size="sm" onClick={onCancel}>
          취소
        </Button>
      }
    >
      <p className={styles.hint} role="status">
        평평한 곳에 내려놓으면 동굴 문이 닫히고 휴식이 시작돼요. 쉬는 동안 휴대폰을 들면 문을 열지 물어볼게요.
      </p>
    </Modal>
  )
}
