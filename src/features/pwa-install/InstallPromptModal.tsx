import { useState } from 'react'
import { Button, Modal } from '@/shared/ui'
import { AddToHomeIcon, ShareIcon } from './icons'
import styles from './InstallPromptModal.module.css'

/**
 * prompt: 설치 이벤트가 있는 브라우저(안드로이드 크롬·삼성 인터넷·데스크톱 크롬/엣지) — "설치하기"로 설치 창
 * ios: iPhone·iPad Safari — 공유 → 홈 화면에 추가 순서 안내
 * openInBrowser: 그 자리에서 설치할 수 없는 곳(iOS 의 다른 브라우저, 인앱 브라우저) — 기본 브라우저로 열기 안내
 */
export type InstallPromptVariant = 'prompt' | 'ios' | 'openInBrowser'

export interface InstallPromptModalProps {
  open: boolean
  variant: InstallPromptVariant
  /** openInBrowser 에서 iPhone·iPad 인지(문구가 "Safari"·"기본 브라우저"로 갈린다) */
  ios: boolean
  /** openInBrowser 에서 버튼으로 기본 브라우저를 열 수 있는 주소(카카오톡·안드로이드 인앱). 없으면 주소 복사만 */
  externalUrl: string | null
  onInstall: () => void
  onOpenExternal: () => void
  onClose: () => void
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // 인앱 웹뷰는 clipboard API 를 막는 곳이 많아 예전 방식으로 한 번 더
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    let ok: boolean
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    area.remove()
    return ok
  }
}

/**
 * 앱 설치 안내(공용 Modal). 시안이 없어 동굴 문 열기·섬 구매 확인과 같은 톤으로 만들었다.
 * 임의 결정(확인 필요): 제목 "폴리의 섬을 앱으로 설치해 보세요", 설명 "홈 화면에서 바로 열고 전체 화면으로 쓸 수 있어요.",
 * iOS 순서 문구, 인앱 문구 "여기서는 설치할 수 없어요 …", 버튼 "다음에"·"설치하기"·"알겠어요"·"주소 복사"·"브라우저로 열기" — 시안 없음
 */
export function InstallPromptModal({
  open,
  variant,
  ios,
  externalUrl,
  onInstall,
  onOpenExternal,
  onClose,
}: InstallPromptModalProps) {
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle')
  const browserName = ios ? 'Safari' : '기본 브라우저'

  const handleCopy = async () => {
    setCopied((await copyText(window.location.href)) ? 'done' : 'failed')
  }

  const title = (
    <span className={styles.heading}>
      <img className={styles.appIcon} src="/pwa-192x192.png" alt="" width={48} height={48} />
      <span>폴리의 섬을 앱으로 설치해 보세요</span>
    </span>
  )

  const footer =
    variant === 'prompt' ? (
      <>
        <Button variant="outline" size="sm" onClick={onClose}>
          다음에
        </Button>
        <Button size="sm" onClick={onInstall}>
          설치하기
        </Button>
      </>
    ) : variant === 'ios' ? (
      <Button size="sm" onClick={onClose}>
        알겠어요
      </Button>
    ) : (
      <>
        <Button variant="outline" size="sm" onClick={onClose}>
          다음에
        </Button>
        {externalUrl ? (
          <Button size="sm" onClick={onOpenExternal}>
            브라우저로 열기
          </Button>
        ) : (
          <Button size="sm" onClick={handleCopy}>
            {copied === 'done' ? '복사했어요' : '주소 복사'}
          </Button>
        )}
      </>
    )

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <p>홈 화면에서 바로 열고 전체 화면으로 쓸 수 있어요.</p>
      {variant === 'ios' && (
        <ol className={styles.steps}>
          <li>
            <span className={styles.stepIcon}>
              <ShareIcon />
            </span>
            <span>
              Safari의 <b className={styles.strong}>공유</b> 버튼을 눌러요
              <span className={styles.hint}>주소창 옆이나 화면 아래, 또는 ··· 메뉴 안에 있어요</span>
            </span>
          </li>
          <li>
            <span className={styles.stepIcon}>
              <AddToHomeIcon />
            </span>
            <span>
              <b className={styles.strong}>홈 화면에 추가</b>를 골라요
              <span className={styles.hint}>안 보이면 목록을 아래로 내려 보세요</span>
            </span>
          </li>
          <li>
            <span className={styles.stepIcon} aria-hidden="true">
              <span className={styles.stepNumber}>3</span>
            </span>
            <span>
              오른쪽 위 <b className={styles.strong}>추가</b>를 누르면 끝이에요
            </span>
          </li>
        </ol>
      )}
      {variant === 'openInBrowser' && (
        <div className={styles.notice}>
          <p>
            여기서는 설치할 수 없어요. <b className={styles.strong}>{browserName}</b>로 열어 홈 화면에 추가해 주세요.
          </p>
          {!externalUrl && <p className={styles.hint}>주소를 복사해 {browserName} 주소창에 붙여 넣으면 돼요.</p>}
          {copied === 'failed' && (
            <p className={styles.warning} role="alert">
              복사하지 못했어요. 주소창의 주소를 길게 눌러 복사해 주세요.
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
