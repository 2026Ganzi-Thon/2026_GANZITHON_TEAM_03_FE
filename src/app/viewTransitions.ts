/**
 * 화면 전환(View Transitions) 손질. 라우터(react-router)가 `document.startViewTransition` 을 직접 부르고 전환 객체를
 * 밖에 내주지 않아서, 앱 시작 때 이 함수를 한 번 감싸 모든 전환에 아래 두 가지를 더한다(app/global.css 의 전환 규칙과 짝).
 *
 * 1. 새 화면 그림을 디코딩한 뒤 전환을 시작한다 — 아직 그려지지 않은 그림은 옮겨 가는 동안 비어 보이다가 끝날 즈음 툭 나타난다
 *    (동굴 섬을 처음 열 때). 너무 오래 걸리면 기다리지 않는다(DECODE_WAIT_MS).
 * 2. 섬(view-transition-name: island)의 크기 변화를 width·height 대신 transform 의 scale 로 바꾼다 — 브라우저 기본 전환은
 *    크기를 width·height 로 움직여 매 프레임 레이아웃을 다시 하고(합성 스레드만으로 못 돌림), iPhone Safari 에서는 새 그림이
 *    그 크기를 못 따라가 엉뚱한 크기·자리로 튀었다. scale 로 바꾸면 처음부터 끝까지 새 그림 한 장을 확대·축소만 한다.
 *
 * View Transitions 를 모르는 브라우저에서는 아무것도 하지 않는다.
 */

/** 전환 시작 전에 새 화면 그림 디코딩을 기다리는 최대 시간(ms). 넘으면 그냥 시작한다 */
const DECODE_WAIT_MS = 250

const ISLAND_GROUP = '::view-transition-group(island)'

type StartViewTransition = (arg?: ViewTransitionUpdateCallback | StartViewTransitionOptions) => ViewTransition

/** 그림이 섬(view-transition-name: island) 안에 있는지 */
function isInIsland(image: HTMLImageElement): boolean {
  for (let element: Element | null = image; element && element !== document.body; element = element.parentElement) {
    if (getComputedStyle(element).viewTransitionName === 'island') return true
  }
  return false
}

/**
 * 새 화면의 섬 그림을 디코딩해 둔다. 이미 디코딩된 그림은 바로 끝난다.
 * 섬만 본다 — 다른 그림(섬 꾸미기 카드 등)까지 기다리면 전환 시작이 늦어지고, 그것들은 제자리에서 흐려지며 바뀌어 늦게 떠도 티가 덜 난다
 */
function decodeIslandImages(): Promise<void> {
  const images = Array.from(document.images).filter(isInIsland)
  const decoding = Promise.all(images.map((image) => image.decode().catch(() => undefined)))
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, DECODE_WAIT_MS))
  return Promise.race([decoding.then(() => undefined), timeout])
}

/** 섬 그룹의 기본 전환(transform + width·height)을 같은 움직임의 transform(이동 + scale) 하나로 바꾼다 */
function scaleIslandInsteadOfResize() {
  const animation = document
    .getAnimations()
    .find((candidate) => candidate.effect instanceof KeyframeEffect && candidate.effect.pseudoElement === ISLAND_GROUP)
  const effect = animation?.effect
  if (!(effect instanceof KeyframeEffect)) return

  const [from, to] = effect.getKeyframes()
  if (!from || !to) return
  const fromWidth = parseFloat(String(from.width))
  const fromHeight = parseFloat(String(from.height))
  const toWidth = parseFloat(String(to.width))
  const toHeight = parseFloat(String(to.height))
  if (![fromWidth, fromHeight, toWidth, toHeight].every((value) => value > 0)) return
  if (typeof from.transform !== 'string' || typeof to.transform !== 'string') return

  // 그룹은 처음부터 새 크기(UA 가 정한 width·height)로 두고, 이전 크기만큼 줄이거나 키운 데서 시작한다.
  // 기준점은 왼쪽 위(global.css 의 transform-origin: 0 0) — 이전 자리의 왼쪽 위에서 출발해 새 자리로 간다
  effect.setKeyframes([
    {
      offset: 0,
      easing: from.easing,
      transform: `${from.transform} scale(${fromWidth / toWidth}, ${fromHeight / toHeight})`,
    },
    { offset: 1, transform: to.transform },
  ])
}

export function installViewTransitionTweaks() {
  if (typeof document.startViewTransition !== 'function') return
  const original = document.startViewTransition.bind(document) as StartViewTransition

  const wrapped: StartViewTransition = (arg) => {
    const update = typeof arg === 'function' ? arg : arg?.update
    const updateThenDecode = async () => {
      await update?.()
      await decodeIslandImages()
    }
    // 함수로 받은 것은 함수로 넘긴다 — 옵션 객체를 모르는 iOS 18.0·18.1 Safari 도 있다
    const transition = original(typeof arg === 'function' || arg === undefined ? updateThenDecode : { ...arg, update: updateThenDecode })
    transition.ready.then(scaleIslandInsteadOfResize, () => undefined)
    return transition
  }

  document.startViewTransition = wrapped as typeof document.startViewTransition
}
