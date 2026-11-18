import { useEffect, useEffectEvent } from 'react'

/**
 * 센서가 알려 주는 휴대폰 상태.
 * - unsupported: 브라우저가 빈 값만 보냄 — 센서가 없는 기기(데스크톱 크롬 등)
 * - silent: 켠 뒤 한동안 아무 값도 오지 않음 — 센서가 없거나, iPhone 에서 아직 권한을 받지 못함(둘을 구분할 수 없다)
 */
export type FlatSensorState = 'flat' | 'tilted' | 'unsupported' | 'silent'

/** 바닥과 이루는 각이 이보다 작으면 눕힘, 이보다 크면 듦. 사이는 직전 상태를 유지한다(경계에서 깜빡이지 않게) */
const FLAT_BELOW_DEG = 12
const TILTED_ABOVE_DEG = 25
/** 눕힘은 1초 이어져야, 듦은 0.5초 이어져야 바뀐 것으로 본다(내려놓는 중·살짝 흔들림을 걸러 냄) */
const FLAT_HOLD_MS = 1000
const TILTED_HOLD_MS = 500
/** 켠 뒤 이 시간 안에 값이 한 번도 안 오면 'silent' */
const NO_DATA_MS = 1500

interface PermissionTarget {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

/**
 * 움직임 센서 권한을 요청한다. iPhone(iOS 13+)은 권한 창이 필요하고, 사용자가 누른 그 순간에 불러야 한다 —
 * 그래서 버튼 누름 처리의 맨 앞에서(await 전에) 부른다. 권한 창이 없는 기기는 바로 true.
 * 센서 자체가 있는지는 여기서 알 수 없고 useFlatSensor 가 값이 오는지로 판단한다.
 */
export function requestMotionPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return Promise.resolve(false)
  const target = window.DeviceMotionEvent as unknown as PermissionTarget
  if (typeof target.requestPermission !== 'function') return Promise.resolve(true)
  return target
    .requestPermission()
    .then((result) => result === 'granted')
    .catch(() => false)
}

/**
 * 휴대폰이 바닥에 평평하게 놓였는지 본다(화면이 위든 아래든). 중력 방향이 화면과 수직에 가까우면 눕힘.
 * 켜져 있는 동안 상태가 바뀌어 자리 잡을 때마다 `onChange` 를 부른다(처음 한 번 포함). 빈 값이면 'unsupported',
 * 아무 값도 오지 않으면 'silent'.
 * 화면이 꺼지거나 앱이 뒤로 가면 브라우저가 값을 보내지 않으므로 그동안의 움직임은 알 수 없다.
 */
export function useFlatSensor(enabled: boolean, onChange: (state: FlatSensorState) => void): void {
  const report = useEffectEvent(onChange)

  useEffect(() => {
    if (!enabled) return
    let settled: FlatSensorState | null = null
    let candidate: 'flat' | 'tilted' | null = null
    let since = 0
    let gotEvent = false

    // 처음 1.5초 동안 실제 값이 한 번도 없으면 판정한다: 빈 값만 왔으면 센서 없는 기기, 아무것도 안 왔으면 'silent'.
    // (빈 값이 한 번 오고 실제 값이 이어지는 브라우저도 있어서 빈 값 하나로 바로 정하지 않는다)
    const noData = window.setTimeout(() => {
      if (settled !== null) return
      settled = gotEvent ? 'unsupported' : 'silent'
      report(settled)
    }, NO_DATA_MS)

    const handleMotion = (event: DeviceMotionEvent) => {
      gotEvent = true
      const gravity = event.accelerationIncludingGravity
      if (!gravity || gravity.x === null || gravity.y === null || gravity.z === null) return
      const length = Math.hypot(gravity.x, gravity.y, gravity.z)
      if (length < 1) return
      const tilt = (Math.acos(Math.min(1, Math.abs(gravity.z) / length)) * 180) / Math.PI
      const previous = candidate ?? (settled === 'flat' ? 'flat' : 'tilted')
      const reading = tilt < FLAT_BELOW_DEG ? 'flat' : tilt > TILTED_ABOVE_DEG ? 'tilted' : previous
      const now = performance.now()
      if (reading !== candidate) {
        candidate = reading
        since = now
      }
      if (reading !== settled && now - since >= (reading === 'flat' ? FLAT_HOLD_MS : TILTED_HOLD_MS)) {
        settled = reading
        report(reading)
      }
    }

    window.addEventListener('devicemotion', handleMotion)
    return () => {
      window.clearTimeout(noData)
      window.removeEventListener('devicemotion', handleMotion)
    }
  }, [enabled])
}
