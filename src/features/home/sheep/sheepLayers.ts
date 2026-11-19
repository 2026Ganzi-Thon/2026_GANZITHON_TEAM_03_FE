import { BASE } from './sheepTuning'

/** 섬에 놓인 가구 하나 — 페이지가 섬 기능의 아이템에서 만들어 넘긴다 */
export interface SheepIslandLayer {
  /** 섬 그림과 같은 크기의 투명 그림(가구가 제자리에 그려진 것) */
  src: string
  /** 바닥에 깔린 것(러그 등). 양보다 늘 아래이고, 동굴 밖으로 나온 부분만 동굴 안 양을 가린다 */
  flat: boolean
}

export interface AnalyzedLayer {
  image: HTMLImageElement
  /** 그림에서 가구가 땅에 닿는 곳(불투명한 부분의 아래 가운데, 앱 px). 읽지 못하면 null — 양을 가리지 않는다 */
  foot: readonly [number, number] | null
}

const cache = new Map<string, Promise<AnalyzedLayer>>()

/** 다음 작업으로 미룬다 — 가구마다 픽셀 읽기를 따로 해 긴 작업 하나로 화면을 막지 않게 */
function nextTask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/** 불투명한 부분의 테두리 상자에서 아래 가운데. 조절 도구의 items.json bottom 과 같은 방법(알파 > 0) */
function measureFoot(image: HTMLImageElement): readonly [number, number] | null {
  const width = image.naturalWidth
  const height = image.naturalHeight
  if (!width || !height) return null
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null
  context.drawImage(image, 0, 0)
  let data: Uint8ClampedArray
  try {
    data = context.getImageData(0, 0, width, height).data
  } catch {
    // 다른 출처 그림(서버 CORS 없음)은 픽셀을 읽을 수 없다
    return null
  }
  let minX = width
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y++) {
    const row = y * width * 4
    for (let x = 0; x < width; x++) {
      if (data[row + x * 4 + 3] > 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        maxY = y
      }
    }
  }
  if (maxX < 0) return null
  const scale = BASE / width
  return [((minX + maxX + 1) / 2) * scale, (maxY + 1) * (BASE / height)]
}

/**
 * 가구 그림을 받아(섬이 이미 받은 것이라 캐시에서 온다) 땅에 닿는 곳을 잰다. 그림마다 한 번만 한다.
 * 임의 결정(확인 필요): 서버가 가구의 발 위치를 주지 않아 그림에서 잰다(다른 출처 그림이면 못 재고, 그 가구는 양을 가리지 않는다).
 */
export function analyzeLayer(src: string): Promise<AnalyzedLayer> {
  let pending = cache.get(src)
  if (!pending) {
    const image = new Image()
    image.decoding = 'async'
    image.src = src
    pending = image
      .decode()
      .then(nextTask)
      .then(() => ({ image, foot: measureFoot(image) }))
    pending.catch(() => cache.delete(src))
    cache.set(src, pending)
  }
  return pending
}
