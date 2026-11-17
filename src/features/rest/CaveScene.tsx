import type { CSSProperties } from 'react'
import caveClosed from '@/assets/images/cave-closed@2x.webp'
import caveOpen from '@/assets/images/cave-open@2x.webp'
import type { CaveDecoration } from './types'
import styles from './CaveScene.module.css'

export interface CaveSceneProps {
  /** 동굴 문이 돌로 닫혀 있는지 */
  closed: boolean
  /** 섬에 놓인 가구(섬 꾸미기에서 산 것). 동굴 안쪽 부분은 문이 닫히면 가려진다 */
  decorations?: CaveDecoration[]
}

/** 물결이 한 번 올라갔다 내려오는 시간(ms). CaveScene.module.css 의 --wave-bob(2.8초)의 두 배 — 홈 섬(IslandScene)과 같다 */
const WAVE_CYCLE_MS = 5600

/** 출렁임을 페이지 시계에 맞춘다: 언제 화면에 붙든 홈 섬의 물결과 같은 박자로 움직인다. 물과 나룻배도 서로 맞는다 */
function syncToWave(element: HTMLElement | null) {
  if (!element) return
  const now = Number(document.timeline?.currentTime ?? 0)
  element.style.setProperty('--wave-sync', `${-(now % WAVE_CYCLE_MS)}ms`)
}

/** 가구 그림 겹. 같은 가구를 동굴 안쪽·바깥쪽 두 겹으로 나눠 그리므로 두 번 쓴다 */
function DecorationLayers({ items }: { items: CaveDecoration[] }) {
  return items.map((item) => (
    <img
      key={item.id}
      ref={item.floatAt ? syncToWave : undefined}
      className={item.floatAt ? `${styles.layer} ${styles.float}` : styles.layer}
      style={
        item.floatAt
          ? ({ '--float-x': `${item.floatAt.x}%`, '--float-y': `${item.floatAt.y}%` } as CSSProperties)
          : undefined
      }
      src={item.src}
      width={313}
      height={313}
      alt=""
      decoding="async"
    />
  ))
}

/**
 * 동굴 섬 그림. 열린 그림 위에 닫힌 그림을 겹쳐 두고 닫힌 그림을 나타내거나 감춰서 문이 닫히고 열리는 것처럼 보인다.
 * 두 그림은 시안 같은 프레임에서 같은 크기·위치로 잘라 둬서 겹쳐도 섬이 어긋나지 않는다(이 화면 전용, 홈의 섬 그림과 별개).
 * 두 장 모두 처음부터 받아 두므로 전환 때 그림을 기다리지 않는다.
 *
 * 물에는 홈 섬(features/island 의 IslandScene)과 같은 빛 물결이 흐르며 출렁인다 — 같은 물 마스크·물결 그림·값을 쓴다
 * (두 그림의 물 자리가 홈 섬 그림과 같다). 기능끼리 import 할 수 없어 구조만 같게 옮겨 왔다(CLAUDE.md 규칙 2).
 *
 * 섬 꾸미기에서 산 가구도 홈처럼 놓인다(그림 자리가 홈 섬 그림과 같아 그대로 겹친다). 가구는 문 자리(열린·닫힌 그림이
 * 다른 곳, door-*-mask)를 경계로 두 겹으로 나눠 그린다: 바깥쪽 겹은 늘 보이고, 안쪽 겹(러그·치즈 선반·꽃 화분 등)은
 * 문이 닫히며 같이 사라지고 열리면 다시 보인다.
 */
export function CaveScene({ closed, decorations = [] }: CaveSceneProps) {
  const items = [...decorations].sort((a, b) => a.order - b.order)
  const names = items.map((item) => item.name).join(', ')
  const base = closed ? '돌로 문을 닫은 동굴 섬' : '문이 열린 동굴 섬'

  return (
    <div
      className={styles.root}
      data-closed={closed || undefined}
      role="img"
      aria-label={names ? `${base}. 놓인 것: ${names}` : base}
    >
      <img className={styles.layer} src={caveOpen} width={313} height={313} alt="" />
      <img className={`${styles.layer} ${styles.door}`} src={caveClosed} width={313} height={313} alt="" />
      {/* 물결: 섬 그림의 물 부분에만(마스크) 빛 띠 두 겹이 서로 반대로 흐르고, 전체가 위아래로 출렁인다 */}
      <div className={styles.water} aria-hidden="true">
        <div ref={syncToWave} className={styles.bob}>
          <i className={styles.waveA} />
          <i className={styles.waveB} />
        </div>
      </div>
      {items.length > 0 && (
        <>
          <div className={`${styles.decor} ${styles.inside}`} aria-hidden="true">
            <DecorationLayers items={items} />
          </div>
          <div className={`${styles.decor} ${styles.outside}`} aria-hidden="true">
            <DecorationLayers items={items} />
          </div>
        </>
      )}
    </div>
  )
}
