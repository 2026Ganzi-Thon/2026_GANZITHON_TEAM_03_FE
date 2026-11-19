import { registerSW } from 'virtual:pwa-register'

/**
 * 서비스 워커 등록. 새 배포가 깔리면 페이지를 새로고침해 새 버전으로 바꾼다.
 *
 * 기본 동작(autoUpdate)은 새 워커가 켜지는 즉시 새로고침한다. 그러면 새 파일을 받는 데 시간이 걸릴 때
 * 스플래시 도중·직후에 새로고침이 일어나 스플래시가 처음부터 다시 나온다(쓰는 중이면 화면이 갑자기 바뀜).
 * 그래서 앱이 화면에서 내려갈 때(다른 앱으로 전환·홈 화면으로 나감) 조용히 새로고침한다.
 * 그때까지는 지금 화면이 이전 버전으로 그대로 돈다 — 화면을 나눠 받는 파일(지연 로딩)이 없어서 안전하다.
 */
export function registerServiceWorker() {
  let reloadPending = false

  const reloadWhenHidden = () => {
    if (document.visibilityState === 'hidden') window.location.reload()
  }

  registerSW({
    immediate: true,
    onNeedReload() {
      if (reloadPending) return
      reloadPending = true
      if (document.visibilityState === 'hidden') {
        window.location.reload()
        return
      }
      document.addEventListener('visibilitychange', reloadWhenHidden)
    },
  })
}
