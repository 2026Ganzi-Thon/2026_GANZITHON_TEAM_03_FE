import cheeseImage from '@/assets/images/cheese.webp'
import { Icon } from '@/shared/ui'
import styles from './CheeseBanner.module.css'

export interface CheeseBannerProps {
  title: string
  caption: string
  onClick?: () => void
}

/**
 * 우유와 치즈 아래의 큰 금색 치즈 카드(시안 396:392). 시안 396:293 에서는 "고민 치즈 남기기"(고민 쓰기 입구)다.
 * 모양·치즈 그림·화살표는 예전 "내 치즈 보관함" 배너(109:1290) 그대로 두고 글자·이동만 쓰는 쪽이 정한다.
 */
export function CheeseBanner({ title, caption, onClick }: CheeseBannerProps) {
  return (
    <button type="button" className={styles.banner} onClick={onClick}>
      <span className={styles.bubbleA} aria-hidden="true" />
      <span className={styles.bubbleB} aria-hidden="true" />
      <span className={styles.bubbleC} aria-hidden="true" />
      <span className={styles.bubbleD} aria-hidden="true" />
      <img src={cheeseImage} alt="" width={97} height={97} className={styles.cheese} />
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        <span className={styles.caption}>{caption}</span>
      </span>
      <Icon name="arrow-right-circle" className={styles.arrow} />
    </button>
  )
}
