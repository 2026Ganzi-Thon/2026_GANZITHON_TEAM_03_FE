import caveClosed from '@/assets/images/cave-closed@2x.webp'
import caveOpen from '@/assets/images/cave-open@2x.webp'
import doorInsideMask from '@/assets/images/cave/door-inside-mask.webp'
import doorOutsideMask from '@/assets/images/cave/door-outside-mask.webp'

let preloaded = false

/**
 * 동굴 문 닫기 화면의 섬 그림(열린·닫힌 동굴)과 가구를 가르는 문 마스크를 미리 받아 브라우저 캐시에 둔다.
 * 홈에서 동굴로 섬이 옮겨 가는 전환 때 그림이 아직 없으면 섬 자리가 비어 보이다가 툭 나타난다. 여러 번 불러도 한 번만 받는다.
 * 물결 마스크·물결 그림은 홈 섬과 같은 파일이라 홈에서 이미 받는다.
 */
export function preloadCaveAssets(): void {
  if (preloaded) return
  preloaded = true

  for (const src of [caveOpen, caveClosed, doorInsideMask, doorOutsideMask]) {
    const image = new Image()
    image.decoding = 'async'
    image.src = src
  }
}
