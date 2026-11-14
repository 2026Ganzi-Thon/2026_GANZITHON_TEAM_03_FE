import sheepImage from '@/assets/images/sheep.png'
import styles from './SheepHero.module.css'

/** 양 먹이주기 화면 위쪽의 양 일러스트(234×234, 가운데). 시안에서 좌우 반전되어 있다. */
export function SheepHero() {
  return <img className={styles.sheep} src={sheepImage} width={234} height={234} alt="웃고 있는 양" />
}
