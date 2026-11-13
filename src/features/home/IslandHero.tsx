import { Button, Icon } from '@/shared/ui'
import islandImage from '@/assets/images/island@2x.png'
import styles from './IslandHero.module.css'

export interface IslandHeroProps {
  onOpenDecorate?: () => void
}

/** "섬 꾸미기" 버튼과 섬 일러스트. */
export function IslandHero({ onOpenDecorate }: IslandHeroProps) {
  return (
    <section className={styles.root} aria-label="나의 섬">
      <Button
        variant="accent"
        className={styles.decorate}
        leftIcon={<Icon name="island" size={24} />}
        onClick={onOpenDecorate}
      >
        섬 꾸미기
      </Button>
      {/* 임의 결정(확인 필요): 섬은 고정 일러스트 — 섬 꾸미기 반영은 API 미결정이라 나중에 */}
      <img
        className={styles.island}
        src={islandImage}
        width={313}
        height={313}
        alt="올리브 나무가 자란 동굴 섬"
      />
    </section>
  )
}
