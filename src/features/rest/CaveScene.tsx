import caveClosed from '@/assets/images/cave-closed@2x.webp'
import caveOpen from '@/assets/images/cave-open@2x.webp'
import styles from './CaveScene.module.css'

export interface CaveSceneProps {
  /** 동굴 문이 돌로 닫혀 있는지 */
  closed: boolean
}

/**
 * 동굴 섬 그림. 열린 그림 위에 닫힌 그림을 겹쳐 두고 닫힌 그림을 나타내거나 감춰서 문이 닫히고 열리는 것처럼 보인다.
 * 두 그림은 시안 같은 프레임에서 같은 크기·위치로 잘라 둬서 겹쳐도 섬이 어긋나지 않는다(이 화면 전용, 홈의 섬 그림과 별개).
 * 두 장 모두 처음부터 받아 두므로 전환 때 그림을 기다리지 않는다.
 */
export function CaveScene({ closed }: CaveSceneProps) {
  return (
    <div
      className={styles.root}
      data-closed={closed || undefined}
      role="img"
      aria-label={closed ? '돌로 문을 닫은 동굴 섬' : '문이 열린 동굴 섬'}
    >
      <img className={styles.layer} src={caveOpen} width={313} height={313} alt="" />
      <img className={`${styles.layer} ${styles.door}`} src={caveClosed} width={313} height={313} alt="" />
    </div>
  )
}
