import islandImage from '@/assets/images/island@2x.webp'
import styles from './IslandScene.module.css'

/**
 * 섬 그림. 홈과 같은 고정 그림이다 — 산 아이템을 섬 위에 놓아 보여주는 것은 2차
 * (아이템별 투명 그림과 좌표가 없다, docs/decisions.md "섬 꾸미기 1차").
 * 들어갈 자리 높이에 맞춰 최대 345px 까지 줄어든다.
 */
export function IslandScene() {
  return (
    <div className={styles.root}>
      <img className={styles.island} src={islandImage} width={345} height={345} alt="올리브 나무가 자란 동굴 섬" />
    </div>
  )
}
