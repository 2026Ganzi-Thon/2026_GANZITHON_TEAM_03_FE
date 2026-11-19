import { BASE, CAVE_PATH, SRC, TUNING } from './sheepTuning'
import type { Piling } from './sheepTuning'

const K = SRC / BASE

let cavePath: Path2D | null = null
let hitContext: CanvasRenderingContext2D | null = null

/** 동굴 입구 선(690 좌표) */
export function caveShape(): Path2D {
  cavePath ??= new Path2D(CAVE_PATH)
  return cavePath
}

/** 섬 전체에서 동굴 입구를 뺀 모양(690 좌표, evenodd 로 자른다) — 러그의 동굴 밖 부분 */
let outsidePath: Path2D | null = null
export function outsideCaveShape(): Path2D {
  if (!outsidePath) {
    outsidePath = new Path2D()
    outsidePath.rect(0, 0, SRC, SRC)
    outsidePath.addPath(caveShape())
  }
  return outsidePath
}

/** 발(앱 px)이 동굴 안인지. 조절 도구처럼 발보다 2px 위를 본다 */
export function isInCave(x: number, y: number): boolean {
  hitContext ??= document.createElement('canvas').getContext('2d')
  if (!hitContext) return false
  return hitContext.isPointInPath(caveShape(), x * K, (y - 2) * K)
}

/** 위아래 위치에 따른 원근 배율 */
export function depthScale(y: number): number {
  const span = TUNING.yFront - TUNING.yBack || 1
  const t = Math.max(0, Math.min(1, (y - TUNING.yBack) / span))
  return TUNING.backScale + (TUNING.frontScale - TUNING.backScale) * t
}

export interface PilingPart {
  path: Path2D
  /** 이 높이(690 좌표)보다 위는 자른다 — 밧줄 고리가 뚜껑보다 위로 삐져나오지 않게 */
  minY?: number
}

const pilingCache = new Map<Piling, PilingPart[]>()

/**
 * 말뚝 모양(690 좌표). 하위 모양마다 따로 자른다(겹친 모양을 한 번에 채우면 감김 방향 때문에 구멍이 생긴다).
 * 뚜껑 높이(capTop)를 따라 몸통 윗변·뚜껑 타원이 함께 움직인다 — 조절 도구의 occParts 와 같다.
 */
export function pilingParts(piling: Piling): PilingPart[] {
  const cached = pilingCache.get(piling)
  if (cached) return cached
  const capY = piling.capTop * K
  const [cx, , rx, ry] = piling.cap
  const [x0, x1, bottom] = piling.body
  const [rcx, rcy, rrx, rry] = piling.ring
  const parts: PilingPart[] = []
  const cap = new Path2D()
  cap.ellipse(cx, capY, rx, ry, 0, 0, Math.PI * 2)
  parts.push({ path: cap })
  if (bottom > capY) {
    const body = new Path2D()
    body.rect(x0, capY, x1 - x0, bottom - capY)
    parts.push({ path: body })
  }
  if (rcy + rry > capY) {
    const ring = new Path2D()
    ring.ellipse(rcx, rcy, rrx, rry, 0, 0, Math.PI * 2)
    parts.push({ path: ring, minY: capY - ry })
  }
  pilingCache.set(piling, parts)
  return parts
}
