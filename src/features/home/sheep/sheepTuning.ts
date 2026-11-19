// 홈 섬의 양 — 사용자가 조절 도구(sheep-anim-assets/tuner)로 직접 맞추고 확정한 값(2026-11-19, sheep-tuning-final.json).
// 단위는 앱 px(섬 313px 기준)이고 위치는 양의 발 위치다. 섬이 다른 크기로 그려지면 비례해서 맞춘다(sheepPlayer.ts).
// 임의 결정(확인 필요): 양 자체가 시안 밖 — 크기·자리·속도·순서 모두 시안이 아니라 조절 도구의 확정값이다.

/** 확정값의 기준 섬 크기(앱 px) */
export const BASE = 313
/** 원본 그림(섬·앞 장·놓인 가구 그림)의 크기(px) — 동굴 입구 선·말뚝 모양은 이 좌표 */
export const SRC = 690

export const TUNING = {
  // 크기(너비, 앱 px)
  restW: 41,
  sleepW: 41,
  walkW: 44,
  standW: 36,
  sniffW: 41,
  // 원근: 발이 yBack 일 때 backScale, yFront 일 때 frontScale, 그 사이는 직선으로
  yBack: 180,
  backScale: 0.9,
  yFront: 234,
  frontScale: 0.9,
  // 걷기
  walkSpeed: 6, // px/초
  walkFps: 13,
  endPause: 2, // 끝에서 멈추는 시간(초)
  // 쉬기·자기 숨쉬기
  breatheAmt: 3.5, // %
  breathePeriod: 3.2, // 초
  // 그림자
  shadowW: 0.71, // 양 너비 대비
  shadowAlpha: 0.37,
  // 흐름에서 머무는 시간(초)
  restHold: 6,
  sleepHold: 8,
  lookHold: 2.5,
  sniffHold: 2.5,
} as const

/** 양이 머무는 자리(발 위치, 앱 px) */
export const SPOTS = {
  rest: [165, 203], // 쉬는 자리
  sleep: [198, 200], // 자는 자리
  inA: [137, 196], // 동굴 안 왼쪽 끝
  inB: [210, 210], // 동굴 앞 오른쪽(오른쪽 보고 서서 냄새 맡기)
  out: [183, 220], // 입구 앞
} as const satisfies Record<string, readonly [number, number]>

export type Spot = keyof typeof SPOTS

/** 동굴 입구 선(690 좌표). 양·가구의 발(y-2)이 이 안이면 "동굴 안" — 앞 테두리(cave-front-mask) 뒤에 그린다 */
export const CAVE_PATH =
  'M 282.0 440.0 C 282.0 440.0 276.6 421.7 275.3 414.0 C 274.1 406.3 274.3 401.8 274.5 394.0 C 274.7 386.3 275.4 375.7 276.5 367.5 C 277.6 359.3 279.5 351.7 281.0 345.0 C 282.5 338.3 282.8 334.6 285.5 327.5 C 288.2 320.4 293.1 310.2 297.0 302.5 C 300.9 294.8 303.8 289.3 309.0 281.5 C 314.2 273.8 322.0 262.8 328.0 256.0 C 334.0 249.2 338.9 245.4 345.0 240.5 C 351.1 235.6 355.2 230.3 364.5 226.5 C 373.8 222.7 388.4 217.8 401.0 217.5 C 413.6 217.3 429.1 220.8 440.0 225.0 C 450.9 229.2 459.0 236.2 466.5 242.5 C 474.0 248.8 479.7 255.8 485.0 263.0 C 490.3 270.3 495.3 279.6 498.5 286.0 C 501.7 292.4 502.1 293.4 504.0 301.5 C 505.9 309.6 509.3 322.0 510.0 334.5 C 510.8 347.0 509.8 363.8 508.5 376.5 C 507.3 389.3 505.2 399.4 502.5 411.0 C 499.8 422.6 492.1 446.0 492.1 446.0 L 282.0 440.0 Z'

export interface Piling {
  /** 뚜껑 타원 [가운데 x, 가운데 y(쓰지 않음 — capTop 이 정함), 반지름 x, 반지름 y] (690 좌표) */
  cap: readonly [number, number, number, number]
  /** 몸통 [왼쪽 x, 오른쪽 x, 아래 y] (690 좌표) */
  body: readonly [number, number, number]
  /** 밧줄 고리 타원 [가운데 x, 가운데 y, 반지름 x, 반지름 y] (690 좌표) */
  ring: readonly [number, number, number, number]
  /** 뚜껑 타원 가운데 높이(앱 px) — 사용자가 맞춘 말뚝 머리 높이 */
  capTop: number
  /** 가림 기준선(발 y, 앱 px). 양의 발이 이 선보다 위(안쪽)면 말뚝이 양 앞을 가린다 */
  occludeBelow: number
}

/** 부두 말뚝 4개. 섬 그림의 말뚝 모양을 양 위에 다시 덮어 양 앞을 가린다 */
export const PILINGS: readonly Piling[] = [
  { cap: [193, 468, 17, 6], body: [176, 210, 505], ring: [193, 500, 22, 10], capTop: 212.3, occludeBelow: 232.3 },
  { cap: [338, 474, 17, 6], body: [321, 356, 560], ring: [338, 505, 22, 11], capTop: 217, occludeBelow: 238.2 },
  { cap: [128, 507, 18, 7], body: [110, 147, 598], ring: [127, 545, 23, 12], capTop: 230, occludeBelow: 256.3 },
  { cap: [256, 537, 19, 7], body: [238, 275, 628], ring: [257, 568, 25, 14], capTop: 243.6, occludeBelow: 272.2 },
]

/** 자는 양 위에 떠오르는 z 의 색 */
export const ZZZ_COLOR = '#59603b'
