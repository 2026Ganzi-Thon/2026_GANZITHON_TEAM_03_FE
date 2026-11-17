import caveClosed from '@/assets/images/cave-closed@2x.webp'
import caveOpen from '@/assets/images/cave-open@2x.webp'
import styles from './CaveScene.module.css'

export interface CaveSceneProps {
  /** 동굴 문이 돌로 닫혀 있는지 */
  closed: boolean
}

/** 물결이 한 번 올라갔다 내려오는 시간(ms). CaveScene.module.css 의 --wave-bob(2.8초)의 두 배 — 홈 섬(IslandScene)과 같다 */
const WAVE_CYCLE_MS = 5600

/** 출렁임을 페이지 시계에 맞춘다: 언제 화면에 붙든 홈 섬의 물결과 같은 박자로 움직인다 */
function syncToWave(element: HTMLElement | null) {
  if (!element) return
  const now = Number(document.timeline?.currentTime ?? 0)
  element.style.setProperty('--wave-sync', `${-(now % WAVE_CYCLE_MS)}ms`)
}

/**
 * 동굴 섬 그림. 열린 그림 위에 닫힌 그림을 겹쳐 두고 닫힌 그림을 나타내거나 감춰서 문이 닫히고 열리는 것처럼 보인다.
 * 두 그림은 시안 같은 프레임에서 같은 크기·위치로 잘라 둬서 겹쳐도 섬이 어긋나지 않는다(이 화면 전용, 홈의 섬 그림과 별개).
 * 두 장 모두 처음부터 받아 두므로 전환 때 그림을 기다리지 않는다.
 * 물에는 홈 섬(features/island 의 IslandScene)과 같은 빛 물결이 흐르며 출렁인다 — 같은 물 마스크·물결 그림·값을 쓴다
 * (두 그림의 물 자리가 홈 섬 그림과 같다). 기능끼리 import 할 수 없어 구조만 같게 옮겨 왔다(CLAUDE.md 규칙 2).
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
      {/* 물결: 섬 그림의 물 부분에만(마스크) 빛 띠 두 겹이 서로 반대로 흐르고, 전체가 위아래로 출렁인다 */}
      <div className={styles.water} aria-hidden="true">
        <div ref={syncToWave} className={styles.bob}>
          <i className={styles.waveA} />
          <i className={styles.waveB} />
        </div>
      </div>
    </div>
  )
}
