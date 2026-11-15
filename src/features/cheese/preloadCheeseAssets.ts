import cheeseImage from '@/assets/images/cheese.webp'
import milkBottleImage from '@/assets/images/milk-bottle.webp'

let preloaded = false

/** 우유와 치즈 화면의 우유병·치즈 이미지를 미리 받아 브라우저 캐시에 둔다. 여러 번 불러도 한 번만 받는다. */
export function preloadCheeseAssets(): void {
  if (preloaded) return
  preloaded = true

  for (const src of [milkBottleImage, cheeseImage]) {
    const image = new Image()
    image.decoding = 'async'
    image.src = src
  }
}
