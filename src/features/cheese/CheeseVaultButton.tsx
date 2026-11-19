import cheeseImage from '@/assets/images/cheese.webp'
import styles from './CheeseVaultButton.module.css'

export interface CheeseVaultButtonProps {
  onClick?: () => void
}

/**
 * "고민 목록" 줄 오른쪽의 보관함 버튼(시안 396:282, 153×43): 금색 테두리 + 치즈 그림 + 금색 글자.
 * 글자는 시안의 "내 고민 보관함"이 아니라 "내 치즈 보관함" — 보관함 화면 제목과 맞춤(사용자 결정, 2026-11-20)
 */
export function CheeseVaultButton({ onClick }: CheeseVaultButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={onClick}>
      <img src={cheeseImage} alt="" width={39} height={39} className={styles.cheese} />
      내 치즈 보관함
    </button>
  )
}
