import { SPOTS, TUNING } from './sheepTuning'
import type { Spot } from './sheepTuning'

/**
 * 양의 하루(조절 도구의 "자동 흐름(자다가 시작)" 장면과 같다):
 * 자기 → 쉬는 자리로 걸어감 → 쉬기 → 동굴 안 왼쪽 끝 → 동굴 앞 오른쪽(오른쪽 보고 서기 → 냄새 맡기 → 1초 서기) → 입구 앞 → 다시 자는 자리 → 반복.
 * 시간은 모두 초 단위로 흐른다 — 화면이 30fps 로 떨어져도(저전력 모드) 걸음 속도·머무는 시간이 어긋나지 않는다.
 */
type Step =
  /** 그 자리에서 자기·쉬기·냄새 맡기 */
  | { kind: 'pose'; pose: 'sleep' | 'rest' | 'sniff'; at: Spot; hold: number; face?: 1 | -1 }
  /** 다음 자리로 걷기 */
  | { kind: 'walk'; to: Spot }
  /** 기본 선 자세로 가만히 서 있기(face 가 있으면 그쪽을 본다) */
  | { kind: 'stand'; hold: number; face?: 1 | -1 }

const ROUTINE: readonly Step[] = [
  { kind: 'pose', pose: 'sleep', at: 'sleep', hold: TUNING.sleepHold },
  { kind: 'walk', to: 'rest' },
  { kind: 'pose', pose: 'rest', at: 'rest', hold: TUNING.restHold },
  { kind: 'walk', to: 'inA' },
  { kind: 'stand', hold: TUNING.endPause },
  { kind: 'walk', to: 'inB' },
  { kind: 'stand', face: 1, hold: TUNING.lookHold },
  { kind: 'pose', pose: 'sniff', at: 'inB', face: 1, hold: TUNING.sniffHold },
  { kind: 'stand', face: 1, hold: 1 },
  { kind: 'walk', to: 'out' },
  { kind: 'stand', hold: TUNING.endPause },
  { kind: 'walk', to: 'sleep' },
]

export type SheepPose = 'walk' | 'stand' | 'sniff' | 'rest' | 'sleep'

export interface SheepState {
  /** 지금 단계(ROUTINE 의 번호) */
  step: number
  /** 지금 단계에 머문 시간(초) */
  elapsed: number
  /** 발 위치(앱 px) */
  x: number
  y: number
  /** 바라보는 쪽: 1 오른쪽, -1 왼쪽 */
  face: 1 | -1
  /** 양이 움직인 총 시간(초) — 걸음 그림·숨쉬기·z 의 박자. 멈춰 있던 동안은 흐르지 않는다 */
  clock: number
}

/** 처음 상태: 자는 자리에서 자는 중 */
export function initialSheepState(): SheepState {
  const [x, y] = SPOTS.sleep
  return { step: 0, elapsed: 0, x, y, face: -1, clock: 0 }
}

function enter(state: SheepState, index: number) {
  state.step = index
  state.elapsed = 0
  const step = ROUTINE[index]
  if (step.kind !== 'walk' && step.face) state.face = step.face
  if (step.kind === 'pose') {
    const [x, y] = SPOTS[step.at]
    state.x = x
    state.y = y
  }
}

/** dt 초만큼 흐르게 한다. 한 번에 여러 단계를 지나갈 만큼 길어도(배속·끊김) 남은 시간을 다음 단계로 넘긴다 */
export function advanceSheep(state: SheepState, dt: number) {
  state.clock += dt
  let left = dt
  // 단계가 0초여도 무한히 돌지 않게 한 번에 넘길 수 있는 단계 수를 제한한다
  for (let guard = 0; left > 0 && guard < ROUTINE.length * 2; guard++) {
    const step = ROUTINE[state.step]
    if (step.kind === 'walk') {
      const [tx, ty] = SPOTS[step.to]
      const dx = tx - state.x
      const dy = ty - state.y
      const distance = Math.hypot(dx, dy)
      if (Math.abs(dx) > 0.3) state.face = dx > 0 ? 1 : -1
      const reach = TUNING.walkSpeed * left
      if (distance <= reach) {
        state.x = tx
        state.y = ty
        left -= distance / TUNING.walkSpeed
        enter(state, (state.step + 1) % ROUTINE.length)
      } else {
        state.x += (dx / distance) * reach
        state.y += (dy / distance) * reach
        state.elapsed += left
        left = 0
      }
    } else {
      const remaining = step.hold - state.elapsed
      if (left >= remaining) {
        left -= Math.max(0, remaining)
        enter(state, (state.step + 1) % ROUTINE.length)
      } else {
        state.elapsed += left
        left = 0
      }
    }
  }
}

/** 지금 그릴 자세 */
export function sheepPose(state: SheepState): SheepPose {
  const step = ROUTINE[state.step]
  if (step.kind === 'walk') return 'walk'
  if (step.kind === 'stand') return 'stand'
  return step.pose
}

/** 정지 그림(움직임 줄이기): 자는 자리에서 자는 양 */
export function restingSheepState(): SheepState {
  return initialSheepState()
}
