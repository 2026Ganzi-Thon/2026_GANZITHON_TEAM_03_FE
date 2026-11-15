import islandImage from '@/assets/images/island@2x.webp'
import type { IslandItem } from './types'
import styles from './IslandScene.module.css'

export interface IslandSceneProps {
  /** 섬에 놓아 보일 아이템(가진 것 + 지금 놓아 보는 것). 놓인 그림이 없는 아이템은 건너뛴다 */
  placed?: IslandItem[]
  /** 놓일 때 나타나는 움직임. 섬 꾸미기에서는 켜고, 이미 놓인 모습만 보여주는 곳(홈)에서는 끈다. 기본 true */
  animate?: boolean
}

/**
 * 섬 그림과 그 위에 놓인 아이템. 아이템마다 섬과 같은 크기의 투명 그림(placedImageUrl)을 순서대로 겹친다 —
 * 자리·크기·그림자가 그림 안에 있어 섬이 줄어들어도(시트 펼침) 그대로 따라 줄어든다.
 * 들어갈 자리에 맞춰 최대 345px 까지 줄어든다. 홈의 섬 자리에도 페이지가 이 컴포넌트를 끼워 넣는다(HomePage).
 */
export function IslandScene({ placed = [], animate = true }: IslandSceneProps) {
  const layers = placed
    .filter((item) => item.placedImageUrl !== null)
    .sort((a, b) => a.placedOrder - b.placedOrder)
  const names = layers.map((item) => item.name).join(', ')

  return (
    <div className={styles.root}>
      <div
        className={styles.canvas}
        role="img"
        aria-label={names ? `올리브 나무가 자란 동굴 섬. 놓인 것: ${names}` : '올리브 나무가 자란 동굴 섬'}
      >
        <img className={styles.layer} src={islandImage} width={345} height={345} alt="" />
        {layers.map((item) => (
          <img
            key={item.itemId}
            className={animate ? `${styles.layer} ${styles.item}` : styles.layer}
            src={item.placedImageUrl ?? undefined}
            width={345}
            height={345}
            alt=""
            decoding="async"
          />
        ))}
      </div>
    </div>
  )
}
