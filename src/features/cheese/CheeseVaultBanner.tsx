import cheeseImage from '@/assets/images/cheese.webp'
import { Icon } from '@/shared/ui'
import styles from './CheeseVaultBanner.module.css'

export interface CheeseVaultBannerProps {
  onClick?: () => void
}

/** "내 치즈 보관함" 배너. 보관함 화면은 아직 없어서 누르면 콜백만 부른다. */
export function CheeseVaultBanner({ onClick }: CheeseVaultBannerProps) {
  return (
    <button type="button" className={styles.banner} onClick={onClick}>
      <span className={styles.bubbleA} aria-hidden="true" />
      <span className={styles.bubbleB} aria-hidden="true" />
      <span className={styles.bubbleC} aria-hidden="true" />
      <span className={styles.bubbleD} aria-hidden="true" />
      <img src={cheeseImage} alt="" width={97} height={97} className={styles.cheese} />
      <span className={styles.text}>
        <span className={styles.title}>내 치즈 보관함</span>
        <span className={styles.caption}>내 치즈는 이곳에 보관돼요</span>
      </span>
      <Icon name="arrow-right-circle" className={styles.arrow} />
    </button>
  )
}
