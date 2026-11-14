import sheepImage from '@/assets/images/sheep.webp'

let preloaded = false

/**
 * 양 먹이주기 화면의 양 일러스트를 미리 받아 브라우저 캐시에 둔다.
 * 사용자가 홈에서 넘어오는 흐름이라 홈이 떠 있는 동안 뒤에서 호출한다. 여러 번 불러도 한 번만 받는다.
 */
export function preloadEmotionAssets(): void {
  if (preloaded) return
  preloaded = true

  const image = new Image()
  image.decoding = 'async'
  image.src = sheepImage
}
