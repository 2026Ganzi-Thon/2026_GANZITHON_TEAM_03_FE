import { useEffect } from 'react'

/**
 * 켜져 있는 동안 화면이 꺼지지 않게 한다(Screen Wake Lock). 화면이 꺼지면 브라우저가 센서 값을 보내지 않아
 * 휴대폰을 든 것을 알 수 없어서다. 탭이 숨었다 돌아오면 브라우저가 풀어 둔 잠금을 다시 건다.
 * 지원하지 않는 브라우저에서는 아무 일도 하지 않는다(화면이 꺼질 수 있음).
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let stopped = false

    const acquire = () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return
      navigator.wakeLock
        .request('screen')
        .then((sentinel) => {
          if (stopped) void sentinel.release()
          else lock = sentinel
        })
        .catch(() => {
          // 배터리 절약 모드 등으로 거절되면 그냥 둔다
        })
    }

    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', acquire)
      void lock?.release()
    }
  }, [active])
}
