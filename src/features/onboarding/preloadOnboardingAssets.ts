import { onboardingSlides } from './slides'

let preloaded = false

/**
 * 온보딩 그림 3장을 미리 받아 브라우저 캐시에 둔다.
 * 스플래시가 떠 있는 동안 뒤에서 호출해 온보딩 첫 장과 단계 전환 때 그림이 늦게 뜨지 않게 한다. 여러 번 불러도 한 번만 받는다.
 */
export function preloadOnboardingAssets(): void {
  if (preloaded) return
  preloaded = true

  onboardingSlides.forEach(({ artwork }) => {
    const image = new Image()
    image.decoding = 'async'
    image.src = artwork
  })
}
