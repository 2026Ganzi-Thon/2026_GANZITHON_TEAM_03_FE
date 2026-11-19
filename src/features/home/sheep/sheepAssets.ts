import caveFrontMaskUrl from '@/assets/images/sheep/cave-front-mask.webp'
import sheepAtlasUrl from '@/assets/images/sheep/sheep-atlas.webp'

/*
 * 양 그림 한 장(sheep-atlas.webp, 600×472)에 걷기 24프레임과 서기·냄새 맡기·쉬기·자기를 모았다.
 * 원본(조절 도구의 walk-sheet 122프레임 200px·PNG 4장, 약 1.4MB)을 실제 표시 크기(최대 약 44px)의 2배 남짓으로 줄였다.
 * 걷기는 원본 122프레임 중 한 걸음 주기(24프레임, 91~114번)만 쓴다 — 원본도 같은 걸음이 5번 반복되고,
 * 마지막 프레임에서 첫 프레임으로 돌아가는 차이가 원본의 이웃 프레임 사이 차이보다 작아 이음매가 보이지 않는다.
 * 프레임 사이에 2px 씩 비워 두어 확대·축소할 때 옆 프레임이 번지지 않는다.
 * cave-front-mask.webp: 섬 그림에서 동굴 입구(와 입구 밑 모래 바닥)를 뚫은 "앞 장"의 투명도만 남긴 것 — 동굴 안 양을 가리는 데만 쓴다.
 */

export interface AtlasRect {
  x: number
  y: number
  w: number
  h: number
  /** 원본 그림의 높이 / 너비 — 그릴 크기는 조절 도구처럼 원본 비율로 정한다 */
  aspect: number
}

export const WALK = {
  x0: 2,
  y0: 2,
  w: 96,
  h: 91,
  cellW: 100,
  cellH: 95,
  cols: 6,
  frames: 24,
  /** 원본 프레임 200×189 */
  aspect: 189 / 200,
} as const

export function walkFrame(index: number): AtlasRect {
  const col = index % WALK.cols
  const row = Math.floor(index / WALK.cols)
  return { x: WALK.x0 + col * WALK.cellW, y: WALK.y0 + row * WALK.cellH, w: WALK.w, h: WALK.h, aspect: WALK.aspect }
}

/** 멈춘 자세. stand 는 오른쪽, sniff 는 왼쪽을 본다(Figma 304:1078·304:1086). rest·sleep 은 캐릭터 시트에서 오림 */
export const STILLS = {
  stand: { x: 2, y: 382, w: 80, h: 88, aspect: 300 / 272 },
  sniff: { x: 86, y: 382, w: 92, h: 70, aspect: 229 / 300 },
  rest: { x: 182, y: 382, w: 92, h: 64, aspect: 204 / 292 },
  sleep: { x: 278, y: 382, w: 92, h: 58, aspect: 192 / 307 },
} as const satisfies Record<string, AtlasRect>

export interface SheepImages {
  atlas: HTMLImageElement
  caveFrontMask: HTMLImageElement
}

let loading: Promise<SheepImages> | null = null
/** 받아 디코딩까지 끝난 그림(아직이면 null) */
let loaded: SheepImages | null = null

function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.decoding = 'async'
  // 홈의 섬 그림·홈 데이터보다 뒤로 — 같은 때 받으면 섬이 늦게 뜬다
  image.fetchPriority = 'low'
  image.src = src
  // decode() 까지 끝내 둔다 — 처음 그릴 때 디코딩으로 멈칫하지 않게. 이 Image 를 계속 들고 있어 다시 디코딩하지 않는다
  return image.decode().then(() => image)
}

/**
 * 양 그림을 받아 디코딩까지 끝낸다. 여러 번 불러도 한 번만 받는다(홈 미리 받기와 양 레이어가 같은 그림을 쓴다).
 * 실패하면 다음에 다시 시도할 수 있게 비운다.
 */
export function loadSheepImages(): Promise<SheepImages> {
  loading ??= Promise.all([loadImage(sheepAtlasUrl), loadImage(caveFrontMaskUrl)])
    .then(([atlas, caveFrontMask]) => (loaded = { atlas, caveFrontMask }))
    .catch((error: unknown) => {
      loading = null
      throw error
    })
  return loading
}

/** 이미 받아 둔 그림. 미리 받기가 끝났으면 홈에 들어오자마자 기다리지 않고 바로 그린다 */
export function loadedSheepImages(): SheepImages | null {
  return loaded
}
