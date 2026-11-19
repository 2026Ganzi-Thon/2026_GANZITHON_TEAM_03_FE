import { STILLS, WALK, loadSheepImages, loadedSheepImages, walkFrame } from './sheepAssets'
import type { AtlasRect, SheepImages } from './sheepAssets'
import { depthScale, isInCave, outsideCaveShape, pilingParts } from './sheepGeometry'
import { analyzeLayer } from './sheepLayers'
import type { SheepIslandLayer } from './sheepLayers'
import { advanceSheep, initialSheepState, restingSheepState, sheepPose } from './sheepRoutine'
import type { SheepState } from './sheepRoutine'
import { BASE, PILINGS, SRC, TUNING, ZZZ_COLOR } from './sheepTuning'

/** 캔버스 해상도 한도 — 3배 화면(iPhone)에서도 2배로 그린다(메모리·그리기 비용, 양이 작아 차이가 보이지 않는다) */
const MAX_DPR = 2
/** 한 프레임에 흐르게 할 최대 시간(초). 오래 멈췄다 돌아와도 양이 순간 이동하지 않게 */
const MAX_STEP = 0.1

/**
 * 같은 실행 중에 이어 가는 양의 상태. 홈을 떠났다 돌아오면 처음(자기)부터가 아니라 떠날 때 하던 데서 이어 간다.
 * 임의 결정(확인 필요): 홈을 떠나 있던 동안은 시간이 흐르지 않는다(돌아오면 그 자리에서 이어서) — 다른 화면에 있는 동안
 * 양이 혼자 움직인 것처럼 자리를 건너뛰면 돌아왔을 때 양이 갑자기 다른 데 있어 어색하다.
 */
let saved: SheepState | null = null

interface PlacedLayer {
  image: HTMLImageElement
  flat: boolean
  foot: readonly [number, number] | null
  inCave: boolean
}

/** 개발 서버에서만 쓰는 시험용 손잡이(배속·상태·그리기 비용). 빌드에는 들어가지 않는다 */
interface SheepDebug {
  speed: number
  state: SheepState | null
  frames: number
  drawMs: number
  maxDrawMs: number
  firstDrawMs: number | null
}
const debug: SheepDebug | null = import.meta.env.DEV
  ? { speed: 1, state: null, frames: 0, drawMs: 0, maxDrawMs: 0, firstDrawMs: null }
  : null
if (debug) Object.assign(window, { __sheep: debug })

function viewTransitionActive(): boolean {
  try {
    return document.documentElement.matches(':active-view-transition')
  } catch {
    // :active-view-transition 을 모르는 브라우저(iOS 18.0·18.1 등)는 전환 중에도 그대로 움직인다
    return false
  }
}

const reducedMotion = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null

/**
 * 홈 섬 위의 양을 캔버스 하나에 그린다. 섬·가구는 아래 DOM(features/island 의 IslandScene)이 그대로 그리고,
 * 이 캔버스는 그 위에 양만 그린다 — 양 앞에 와야 하는 것(동굴 앞 테두리·발이 더 앞인 가구·부두 말뚝)은
 * 양 그림에서 그 모양만큼 지워(destination-out) 아래 DOM 그림이 비쳐 보이게 한다. 결과는 조절 도구의 그리는 순서와 같다:
 *   섬 → 러그 → 동굴 안 가구·양(발 y 순) → 앞 장 → 러그의 동굴 밖 부분 → 동굴 밖 가구·부두 말뚝·양(발 y 순)
 *
 * 성능: requestAnimationFrame 하나. 매 프레임 양 둘레만 지우고 다시 그린다(섬 전체를 다시 그리지 않음).
 * 화면 밖·탭 숨김·화면 전환 중·움직임 줄이기에서는 돌지 않는다. 시간은 초 단위라 30fps(저전력)에서도 속도가 같다.
 */
export class SheepPlayer {
  private readonly canvas: HTMLCanvasElement
  private readonly context: CanvasRenderingContext2D | null
  private readonly scratch = document.createElement('canvas')
  private readonly scratchContext: CanvasRenderingContext2D | null
  private readonly onReady: () => void
  private readonly state: SheepState
  private images: SheepImages | null = loadedSheepImages()
  private layers: PlacedLayer[] = []
  private layersRequested = 0
  private layersDone = -1
  private ready = false
  private destroyed = false
  /** 캔버스 1px 당 앱 px(섬 313 기준)의 비율 — 캔버스 픽셀 = 앱 px × scale */
  private scale = 0
  private visible = true
  private frame = 0
  private last = 0
  /** 지난 프레임에 그린 곳(캔버스 픽셀) — 다음 프레임에 여기만 지운다 */
  private dirty: [number, number, number, number] | null = null
  private readonly mountedAt = performance.now()
  private drawnOnce = false
  private readonly cleanups: (() => void)[] = []

  constructor(canvas: HTMLCanvasElement, onReady: () => void) {
    this.canvas = canvas
    this.context = canvas.getContext('2d')
    this.scratchContext = this.scratch.getContext('2d')
    this.onReady = onReady
    saved ??= initialSheepState()
    this.state = saved
    if (debug) debug.state = this.state

    if (!this.images) {
      loadSheepImages().then(
        (images) => {
          this.images = images
          this.checkReady()
        },
        () => undefined, // 그림을 못 받으면 양 없이 섬만 보인다
      )
    }

    const resize = new ResizeObserver(() => this.resize())
    resize.observe(canvas)
    this.cleanups.push(() => resize.disconnect())

    const intersection = new IntersectionObserver((entries) => {
      this.visible = entries.some((entry) => entry.isIntersecting)
      this.update()
    })
    intersection.observe(canvas)
    this.cleanups.push(() => intersection.disconnect())

    const onVisibility = () => this.update()
    document.addEventListener('visibilitychange', onVisibility)
    this.cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility))

    if (reducedMotion) {
      const onMotion = () => {
        this.update()
        this.drawStill()
      }
      reducedMotion.addEventListener('change', onMotion)
      this.cleanups.push(() => reducedMotion.removeEventListener('change', onMotion))
    }
    this.resize()
  }

  /** 섬에 놓인 가구. 바뀌면 다시 재고, 다 잴 때까지는 전에 쓰던 것으로 그린다 */
  setLayers(layers: SheepIslandLayer[]) {
    const request = ++this.layersRequested
    Promise.all(
      layers.map((layer) =>
        analyzeLayer(layer.src).then(
          ({ image, foot }): PlacedLayer => ({
            image,
            flat: layer.flat,
            foot,
            inCave: foot ? isInCave(foot[0], foot[1]) : false,
          }),
          () => null, // 못 받은 가구는 건너뛴다
        ),
      ),
    ).then((placed) => {
      if (this.destroyed || request !== this.layersRequested) return
      this.layers = placed.filter((layer): layer is PlacedLayer => layer !== null)
      this.layersDone = request
      this.checkReady()
      this.drawStill()
    })
  }

  destroy() {
    this.destroyed = true
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
    for (const cleanup of this.cleanups) cleanup()
  }

  private checkReady() {
    if (this.ready || this.destroyed || !this.images || this.layersDone < 0) return
    this.ready = true
    // 그림이 다 준비된 뒤에만 양을 보인다(그 전에는 아예 그리지 않음). 나타날 때는 CSS 가 서서히 보이게 한다
    this.drawStill()
    this.update()
    this.onReady()
  }

  private get reduced(): boolean {
    return reducedMotion?.matches ?? false
  }

  private canRun(): boolean {
    return this.ready && !this.destroyed && this.visible && !document.hidden && !this.reduced && this.scale > 0
  }

  /** 돌 수 있으면 루프를 켜고, 아니면 끈다 */
  private update() {
    if (this.canRun()) {
      if (!this.frame) {
        this.last = 0
        this.frame = requestAnimationFrame(this.tick)
      }
    } else if (this.frame) {
      cancelAnimationFrame(this.frame)
      this.frame = 0
    }
  }

  private readonly tick = (now: number) => {
    this.frame = 0
    if (!this.canRun()) return
    this.frame = requestAnimationFrame(this.tick)
    // 화면 전환(섬이 옮겨 가는 중)에는 멈춘다 — 그리면 옮겨 가는 섬 그림을 매 프레임 다시 떠서 iPhone 에서 끊긴다
    if (viewTransitionActive()) {
      this.last = 0
      return
    }
    const dt = this.last ? Math.min(MAX_STEP, (now - this.last) / 1000) : 0
    this.last = now
    advanceSheep(this.state, dt * (debug?.speed ?? 1))
    if (debug) {
      const started = performance.now()
      this.draw(this.state, true)
      const spent = performance.now() - started
      debug.frames++
      debug.drawMs += spent
      debug.maxDrawMs = Math.max(debug.maxDrawMs, spent)
    } else {
      this.draw(this.state, true)
    }
  }

  private resize() {
    const width = this.canvas.clientWidth
    if (!width || !this.context) return
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    const pixels = Math.round(width * dpr)
    if (pixels !== this.canvas.width) {
      this.canvas.width = pixels
      this.canvas.height = pixels
      this.dirty = null
    }
    this.scale = pixels / BASE
    this.drawStill()
    this.update()
  }

  /** 루프가 돌지 않을 때 한 번 그린다(움직임 줄이기면 자는 양 정지 그림) */
  private drawStill() {
    if (!this.ready || this.scale <= 0 || this.frame) return
    if (this.reduced) this.draw(restingSheepState(), false)
    else this.draw(this.state, true)
  }

  private draw(state: SheepState, animated: boolean) {
    const context = this.context
    const scratch = this.scratchContext
    const images = this.images
    if (!context || !scratch || !images) return
    const f = this.scale
    const pose = animated ? sheepPose(state) : 'sleep'
    const depth = depthScale(state.y)

    let rect: AtlasRect
    let width: number
    let flip = false
    let breathe = 1
    if (pose === 'walk') {
      // 걷는 그림은 왼쪽을 본다 → 오른쪽으로 갈 때 뒤집는다
      rect = walkFrame(Math.floor(state.clock * TUNING.walkFps) % WALK.frames)
      width = TUNING.walkW * depth
      flip = state.face > 0
    } else if (pose === 'stand') {
      // 기본 선 자세는 오른쪽을 본다 → 왼쪽을 볼 때 뒤집는다
      rect = STILLS.stand
      width = TUNING.standW * depth
      flip = state.face < 0
    } else if (pose === 'sniff') {
      // 냄새 맡기는 왼쪽을 본다 → 오른쪽을 볼 때 뒤집는다
      rect = STILLS.sniff
      width = TUNING.sniffW * depth
      flip = state.face > 0
    } else {
      rect = STILLS[pose]
      width = (pose === 'rest' ? TUNING.restW : TUNING.sleepW) * depth
      if (animated) {
        const phase = (state.clock * 2 * Math.PI) / TUNING.breathePeriod
        breathe = 1 + (TUNING.breatheAmt / 100) * (0.5 - 0.5 * Math.cos(phase))
      }
    }
    const height = width * rect.aspect
    const shadowWidth = width * TUNING.shadowW
    const shadowRx = shadowWidth / 2
    const shadowRy = Math.max(1.5, shadowWidth * 0.07)

    // 양·그림자를 둘러싼 상자(앱 px → 캔버스 픽셀, 정수로)
    const half = Math.max(width / 2, shadowRx) + 1
    const left = state.x - half
    const right = state.x + half
    const top = state.y - height * breathe - 1
    const bottom = state.y + shadowRy + 1
    const x0 = Math.floor(left * f)
    const y0 = Math.floor(top * f)
    const w = Math.ceil(right * f) - x0
    const h = Math.ceil(bottom * f) - y0

    // 1) 작은 캔버스에 그림자·양을 그린다
    if (this.scratch.width < w || this.scratch.height < h) {
      this.scratch.width = Math.max(this.scratch.width, w)
      this.scratch.height = Math.max(this.scratch.height, h)
    }
    scratch.setTransform(1, 0, 0, 1, 0, 0)
    scratch.globalCompositeOperation = 'source-over'
    scratch.clearRect(0, 0, w, h)
    scratch.setTransform(f, 0, 0, f, -x0, -y0)
    if (shadowWidth > 0 && TUNING.shadowAlpha > 0) {
      scratch.fillStyle = `rgba(89, 70, 40, ${TUNING.shadowAlpha})`
      scratch.beginPath()
      scratch.ellipse(state.x, state.y - 1, shadowRx, shadowRy, 0, 0, Math.PI * 2)
      scratch.fill()
    }
    scratch.save()
    scratch.translate(state.x, state.y)
    if (flip) scratch.scale(-1, 1)
    scratch.scale(1, breathe)
    scratch.drawImage(images.atlas, rect.x, rect.y, rect.w, rect.h, -width / 2, -height, width, height)
    scratch.restore()

    // 2) 양 앞에 오는 것의 모양만큼 지운다 → 아래 DOM 의 섬·가구가 그 자리에 보인다
    scratch.globalCompositeOperation = 'destination-out'
    this.eraseOccluders(scratch, state, images, { left, top, right, bottom })
    scratch.globalCompositeOperation = 'source-over'

    // 3) 화면 캔버스: 지난 자리만 지우고 새 자리에 옮겨 붙인다
    context.setTransform(1, 0, 0, 1, 0, 0)
    if (this.dirty) context.clearRect(...this.dirty)
    else context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    context.drawImage(this.scratch, 0, 0, w, h, x0, y0, w, h)
    let dirty: [number, number, number, number] = [x0, y0, w, h]

    // 4) 자는 양 위에 z 가 떠오른다(가려지지 않음 — 조절 도구처럼 맨 위)
    if (pose === 'sleep' && animated) dirty = union(dirty, this.drawZzz(context, state, width, height))
    this.dirty = dirty

    if (!this.drawnOnce) {
      this.drawnOnce = true
      performance.mark('sheep:first-draw')
      if (debug) debug.firstDrawMs = performance.now() - this.mountedAt
    }
  }

  private eraseOccluders(
    scratch: CanvasRenderingContext2D,
    state: SheepState,
    images: SheepImages,
    box: { left: number; top: number; right: number; bottom: number },
  ) {
    const inside = isInCave(state.x, state.y)
    for (const layer of this.layers) {
      if (layer.flat || !layer.foot) continue
      // 같은 쪽(동굴 안끼리·밖끼리)은 발이 더 앞(아래)이면 양 앞. 동굴 안 양에게는 동굴 밖 가구가 모두 앞
      const inFront = layer.inCave === inside ? layer.foot[1] > state.y : inside
      if (inFront) eraseImage(scratch, layer.image, box)
    }
    if (inside) {
      // 동굴 안: 앞 장(입구를 뚫은 섬)이 양을 가리고, 러그는 동굴 밖으로 나온 부분만 앞 장 위에 다시 깔려 양을 가린다
      eraseImage(scratch, images.caveFrontMask, box)
      const flats = this.layers.filter((layer) => layer.flat)
      if (flats.length) {
        scratch.save()
        scratch.scale(BASE / SRC, BASE / SRC)
        scratch.clip(outsideCaveShape(), 'evenodd')
        scratch.scale(SRC / BASE, SRC / BASE)
        for (const layer of flats) eraseImage(scratch, layer.image, box)
        scratch.restore()
      }
    }
    // 부두 말뚝: 섬 그림의 말뚝 모양만큼(섬 그림은 거의 불투명) 양을 가린다
    scratch.fillStyle = '#000'
    for (const piling of PILINGS) {
      if (!inside && !(piling.occludeBelow > state.y)) continue
      scratch.save()
      scratch.scale(BASE / SRC, BASE / SRC)
      for (const part of pilingParts(piling)) {
        if (part.minY !== undefined) {
          scratch.save()
          scratch.beginPath()
          scratch.rect(0, part.minY, SRC, SRC)
          scratch.clip()
          scratch.fill(part.path)
          scratch.restore()
        } else {
          scratch.fill(part.path)
        }
      }
      scratch.restore()
    }
  }

  /** 자는 양 위의 z 세 개(조절 도구와 같은 박자·크기). 그린 곳(캔버스 픽셀)을 돌려준다 */
  private drawZzz(context: CanvasRenderingContext2D, state: SheepState, width: number, height: number) {
    const f = this.scale
    const glyph = zGlyph(f)
    const baseX = state.x + width * 0.35
    const baseY = state.y - height - 2
    for (let i = 0; i < 3; i++) {
      const p = (state.clock / 3.6 + i / 3) % 1
      const alpha = p < 0.25 ? p / 0.25 : 1 - (p - 0.25) / 0.75
      if (alpha <= 0 || !glyph) continue
      // 가장 큰 크기(12px)로 한 번 그려 둔 z 를 줄여 붙인다 — 매 프레임 글꼴을 바꾸면 화면 캔버스가 스타일 계산을 다시 한다
      const k = (8 + 4 * p) / Z_MAX
      context.globalAlpha = alpha
      context.drawImage(
        glyph.canvas,
        (baseX + 12 * p) * f - glyph.originX * k,
        (baseY - 24 * p) * f - glyph.originY * k,
        glyph.canvas.width * k,
        glyph.canvas.height * k,
      )
    }
    context.globalAlpha = 1
    // z 가 지나가는 범위 전체(글자 크기 최대 12px, 오른쪽으로 12px·위로 24px 이동)
    const x0 = Math.floor((baseX - 1) * f)
    const y0 = Math.floor((baseY - 24 - 13) * f)
    return [x0, y0, Math.ceil((baseX + 12 + 11) * f) - x0, Math.ceil((baseY + 4) * f) - y0] as [number, number, number, number]
  }
}

/** z 의 가장 큰 글자 크기(앱 px). 조절 도구는 8px 에서 12px 로 커지며 떠오른다 */
const Z_MAX = 12
let zCache: { scale: number; canvas: HTMLCanvasElement; originX: number; originY: number } | null = null

/** 캔버스 배율 f 에서 12px z 한 글자를 화면 밖 캔버스에 그려 둔다. origin 은 글자의 기준점(왼쪽·글자 바닥선) */
function zGlyph(f: number) {
  if (zCache?.scale === f) return zCache
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return null
  const font = `700 ${Z_MAX * f}px -apple-system, sans-serif`
  context.font = font
  const metrics = context.measureText('z')
  const pad = 2
  const originX = Math.ceil(metrics.actualBoundingBoxLeft) + pad
  const originY = Math.ceil(metrics.actualBoundingBoxAscent) + pad
  canvas.width = originX + Math.ceil(metrics.actualBoundingBoxRight) + pad
  canvas.height = originY + Math.ceil(metrics.actualBoundingBoxDescent) + pad
  context.font = font
  context.fillStyle = ZZZ_COLOR
  context.fillText('z', originX, originY)
  zCache = { scale: f, canvas, originX, originY }
  return zCache
}

/** 섬과 같은 크기(정사각형)의 그림에서 상자 부분만 그린다(지우기 모드에서는 그 모양만큼 지운다) */
function eraseImage(
  scratch: CanvasRenderingContext2D,
  image: HTMLImageElement,
  box: { left: number; top: number; right: number; bottom: number },
) {
  const left = Math.max(0, box.left)
  const top = Math.max(0, box.top)
  const right = Math.min(BASE, box.right)
  const bottom = Math.min(BASE, box.bottom)
  if (right <= left || bottom <= top) return
  const k = image.naturalWidth / BASE
  scratch.drawImage(image, left * k, top * k, (right - left) * k, (bottom - top) * k, left, top, right - left, bottom - top)
}

function union(a: [number, number, number, number], b: [number, number, number, number]): [number, number, number, number] {
  const x0 = Math.min(a[0], b[0])
  const y0 = Math.min(a[1], b[1])
  return [x0, y0, Math.max(a[0] + a[2], b[0] + b[2]) - x0, Math.max(a[1] + a[3], b[1] + b[3]) - y0]
}
