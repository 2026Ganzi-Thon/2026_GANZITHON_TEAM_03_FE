import { useEffect, useId, useRef } from 'react'
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import styles from './Modal.module.css'

export interface ModalProps extends Omit<ComponentPropsWithoutRef<'dialog'>, 'title' | 'open' | 'onClose'> {
  open: boolean
  /** ESC, 배경 클릭으로 닫으려 할 때 불린다. open 을 false 로 바꾸는 것은 쓰는 쪽 몫 */
  onClose: () => void
  /** 팝업 제목. 있으면 dialog 의 접근 가능한 이름이 된다 */
  title?: ReactNode
  /** 본문 아래 버튼 영역 */
  footer?: ReactNode
  /** 배경을 눌러도 닫을지. 기본 true */
  closeOnBackdrop?: boolean
}

/**
 * 안내 팝업. 네이티브 `<dialog>` 를 써서 포커스 이동·가두기, ESC, 배경 비활성화(inert)를 브라우저가 처리한다.
 * 닫히면 열기 전에 포커스가 있던 요소로 돌아간다. 열려 있는 동안 배경 스크롤은 막는다.
 */
export function Modal({
  open,
  onClose,
  title,
  footer,
  closeOnBackdrop = true,
  className,
  children,
  ...rest
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    // 패널 밖(= dialog 자신)을 눌렀을 때만 닫는다
    if (closeOnBackdrop && event.target === event.currentTarget) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={title ? titleId : undefined}
      className={cx(styles.dialog, className)}
      onCancel={(event) => {
        // ESC: 브라우저가 알아서 닫지 않도록 막고 상태는 쓰는 쪽에서 바꾸게 한다
        event.preventDefault()
        onClose()
      }}
      onClick={handleBackdropClick}
      {...rest}
    >
      <div className={styles.panel}>
        {title && (
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </dialog>
  )
}
