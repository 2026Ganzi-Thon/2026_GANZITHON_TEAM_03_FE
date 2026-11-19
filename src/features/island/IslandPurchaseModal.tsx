import { Button, Modal } from '@/shared/ui'
import type { IslandItem, PurchaseIslandItemState } from './types'
import styles from './IslandPurchaseModal.module.css'

export interface IslandPurchaseModalProps {
  /** 사려는 아이템. null 이면 닫혀 있다 */
  item: IslandItem | null
  woolBalance: number
  state: PurchaseIslandItemState
  onConfirm: () => void
  onClose: () => void
}

/** 받침이 있으면 "을", 없으면 "를" (한글이 아니면 "을(를)") */
function objectParticle(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (code < 0 || code > 11171) return '을(를)'
  return code % 28 === 0 ? '를' : '을'
}

/**
 * 구매 확인(공용 Modal). 양털이 모자라면 몇 개 더 필요한지 알리고 `구매`를 막는다. 사는 동안은 두 버튼 모두 막는다.
 * 임의 결정(확인 필요): 문구("…을 양털 N개로 살까요?", "구매하면 양털이 N개 남아요", "양털이 N개 더 필요해요", 실패 문구) — 시안 없음
 */
export function IslandPurchaseModal({ item, woolBalance, state, onConfirm, onClose }: IslandPurchaseModalProps) {
  const purchasing = state.status === 'purchasing'
  const shortage = item ? item.price - woolBalance : 0
  const unavailable = state.status === 'not-found'
  const close = () => {
    if (!purchasing) onClose()
  }

  const message = !item
    ? null
    : unavailable
      ? '지금은 살 수 없는 아이템이에요.'
      : shortage > 0
        ? `양털이 ${shortage}개 더 필요해요.`
        : state.status === 'error'
          ? '구매하지 못했어요. 잠시 후 다시 시도해 주세요.'
          : `구매하면 양털이 ${woolBalance - item.price}개 남아요.`

  return (
    <Modal
      open={item !== null}
      onClose={close}
      closeOnBackdrop={!purchasing}
      title={item ? `${item.name}${objectParticle(item.name)} 양털 ${item.price}개로 살까요?` : undefined}
      footer={
        <>
          <Button variant="outline" size="sm" disabled={purchasing} onClick={close}>
            취소
          </Button>
          <Button size="sm" disabled={purchasing || shortage > 0 || unavailable} onClick={onConfirm}>
            구매
          </Button>
        </>
      }
    >
      {message && (
        <p className={shortage > 0 || state.status === 'error' || unavailable ? styles.warning : undefined} role={shortage > 0 ? undefined : 'status'}>
          {message}
        </p>
      )}
    </Modal>
  )
}
