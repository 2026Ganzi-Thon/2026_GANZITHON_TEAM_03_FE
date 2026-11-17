/**
 * 고를 수 있는 휴식 시간(초): 5분부터 60분까지 5분 단위. 끝은 명세의 허용 범위(60~3,600초, 제안) 안에서.
 * 임의 결정(확인 필요): 5분 단위·최대 60분 — 시안은 05:00 / 10:00 / 15:00 세 개만 보인다(사용자 요청으로 휠로 바꿈)
 */
export const REST_DURATION_OPTIONS: readonly number[] = Array.from({ length: 12 }, (_, index) => (index + 1) * 5 * 60)

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
