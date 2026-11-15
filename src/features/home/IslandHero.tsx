import type { ReactNode } from 'react'
import { Button, Icon } from '@/shared/ui'
import islandImage from '@/assets/images/island@2x.webp'
import styles from './IslandHero.module.css'

export interface IslandHeroProps {
  onOpenDecorate?: () => void
  /**
   * 섬 자리에 대신 그릴 것. 섬 꾸미기에서 산 가구가 놓인 섬은 island 기능이 그리는데 기능끼리 import 할 수 없어서
   * (CLAUDE.md 규칙 2) 페이지가 만들어 넣어 준다. 없으면 기본 섬 그림.
   */
  island?: ReactNode
}

/** "섬 꾸미기" 버튼과 섬 일러스트. */
export function IslandHero({ onOpenDecorate, island }: IslandHeroProps) {
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
      {island ? (
        <div className={styles.slot}>{island}</div>
      ) : (
        <img
          className={styles.island}
          src={islandImage}
          width={313}
          height={313}
          alt="올리브 나무가 자란 동굴 섬"
        />
      )}
    </section>
  )
}
