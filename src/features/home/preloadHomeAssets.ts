import islandImage from '@/assets/images/island@2x.webp'
import { loadSheepImages } from './sheep/sheepAssets'

let preloaded = false

/** 브라우저가 한가할 때(없으면 잠시 뒤) — iOS Safari 에는 requestIdleCallback 이 없다 */
function whenIdle(run: () => void) {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 1500 })
  else setTimeout(run, 200)
}

/**
 * 홈에서 처음 보이는 큰 이미지(섬 일러스트)를 미리 받아 브라우저 캐시에 둔다.
 * 온보딩처럼 홈에 오기 전 화면이 떠 있는 동안 뒤에서 호출한다. 화면 그리기를 막지 않고, 여러 번 불러도 한 번만 받는다.
 * 순서: 섬 그림(보통 우선순위) → 섬 디코딩이 끝나고 한가할 때 양 그림(낮은 우선순위, 디코딩까지) — 섬과 홈 데이터가 먼저다.
 */
export function preloadHomeAssets(): void {
  if (preloaded) return
  preloaded = true

  // 작은 SVG 아이콘·제목 모서리는 빌드할 때 코드에 인라인되므로 따로 받을 필요가 없다
  const image = new Image()
  image.decoding = 'async'
  image.src = islandImage
  const loadSheep = () => whenIdle(() => loadSheepImages().catch(() => undefined))
  image.decode().then(loadSheep, loadSheep)
}
