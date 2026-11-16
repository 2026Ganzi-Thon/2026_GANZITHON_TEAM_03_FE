/** 고를 수 있는 휴식 시간(초). 시안의 05:00 / 10:00 / 15:00 */
export const REST_DURATION_OPTIONS = [5 * 60, 10 * 60, 15 * 60] as const

/** 처음 골라져 있는 시간. 시안에서 가운데 10:00 이 선택된 모습 */
export const DEFAULT_REST_DURATION = 10 * 60

/** 동굴 문이 닫히고 열리는 시간(ms). CaveScene.module.css 의 전환 시간과 같다 */
const DOOR_MS = 700

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** 문 전환이 끝날 때까지 기다린다. 움직임 줄이기 설정이면 바로 끝난다 */
export function waitForDoor(): Promise<void> {
  const ms = prefersReducedMotion() ? 0 : DOOR_MS
  return new Promise((resolve) => setTimeout(resolve, ms))
}
