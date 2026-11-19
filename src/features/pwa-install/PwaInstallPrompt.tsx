import { useEffect, useState, useSyncExternalStore } from 'react'
import { buildExternalUrl } from './inAppEscape'
import { getInstallEvent, promptInstall, subscribeInstallEvent } from './installEvent'
import { InstallPromptModal } from './InstallPromptModal'
import type { InstallPromptVariant } from './InstallPromptModal'
import { getPlatformInfo, isStandalone } from './platform'
import type { PlatformInfo } from './platform'
import { hasSeenInstallPrompt, markInstallPromptShown, recordInstallChoice } from './seen'

/** 띄워도 되는 화면에 들어온 뒤 이만큼 머물면 띄운다 — 화면이 자리 잡은 뒤에 보이게 */
const SHOW_DELAY_MS = 1200

export interface PwaInstallPromptProps {
  /** 지금 띄워도 되는 화면인지(스플래시·온보딩 등 연출 중이면 false). 붙이는 쪽(app)이 정한다 */
  ready: boolean
}

function decideVariant(platform: PlatformInfo, hasInstallEvent: boolean): InstallPromptVariant | null {
  if (platform.inApp) return 'openInBrowser'
  if (platform.ios) return platform.iosSafari ? 'ios' : 'openInBrowser'
  // 안드로이드 크롬·삼성 인터넷·데스크톱 크롬/엣지: 설치 이벤트가 온 뒤에만. 오지 않는 브라우저는 띄우지 않는다
  return hasInstallEvent ? 'prompt' : null
}

/**
 * 브라우저 탭으로 들어온 사용자에게 앱 설치를 한 번 권한다. 설치된 앱으로 열었거나 이 기기에서 본 적이 있으면 아무것도 안 한다.
 * 설치 이벤트는 main.tsx 가 `captureInstallEvents()` 로 미리 받아 둔다.
 */
export function PwaInstallPrompt({ ready }: PwaInstallPromptProps) {
  // 앱을 연 순간 한 번만 판단한다(열려 있는 동안 바뀌지 않는다)
  const [eligible] = useState(() => !isStandalone() && !hasSeenInstallPrompt())
  const [platform] = useState(getPlatformInfo)
  const installEvent = useSyncExternalStore(subscribeInstallEvent, getInstallEvent, () => null)
  const [shown, setShown] = useState<InstallPromptVariant | null>(null)
  const [open, setOpen] = useState(false)

  const variant = decideVariant(platform, installEvent !== null)
  const canShow = eligible && ready && shown === null && variant !== null

  useEffect(() => {
    if (!canShow || !variant) return
    const timer = window.setTimeout(() => {
      markInstallPromptShown()
      setShown(variant)
      setOpen(true)
    }, SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [canShow, variant])

  if (!shown) return null

  const externalUrl = shown === 'openInBrowser' ? buildExternalUrl(window.location.href, platform) : null
  // iOS 다른 인앱의 x-safari 는 확실하지 않아 버튼으로는 내지 않는다(주소 복사로 안내)
  const buttonExternalUrl = externalUrl && !externalUrl.startsWith('x-safari-') ? externalUrl : null

  return (
    <InstallPromptModal
      open={open}
      variant={shown}
      ios={platform.ios}
      externalUrl={buttonExternalUrl}
      onInstall={async () => {
        setOpen(false)
        const outcome = await promptInstall()
        if (outcome !== 'unavailable') recordInstallChoice(outcome)
      }}
      onOpenExternal={() => {
        if (buttonExternalUrl) window.location.href = buttonExternalUrl
      }}
      onClose={() => setOpen(false)}
    />
  )
}
