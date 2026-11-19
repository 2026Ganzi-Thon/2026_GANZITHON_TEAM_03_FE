import { useState } from 'react'
import { Button, Modal } from '@/shared/ui'
import { AddToHomeIcon, CheckIcon, ShareIcon } from './icons'
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
 * 앱 설치 안내(공용 Modal). 앱 아이콘·제목·한 줄 설명을 가운데 정렬하고, iOS 는 아이콘 + 짧은 한 줄 3단계, 버튼은 가로 꽉.
 * 임의 결정(확인 필요): 제목 "폴리의 섬을 앱으로 설치해 보세요", 설명 "홈 화면에서 바로 열 수 있어요." /
 * "{Safari|기본 브라우저}에서 열어야 설치할 수 있어요.", iOS 단계 "공유 누르기 → 홈 화면에 추가 고르기 → 추가 누르기",
 * 버튼 "다음에"·"설치하기"·"알겠어요"·"주소 복사"·"브라우저로 열기" — 시안 없음, 사용자 요청으로 문구를 짧게(2026-11-19)
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
      <img className={styles.appIcon} src="/pwa-192x192.png" alt="" width={56} height={56} />
      <span>폴리의 섬을 앱으로 설치해 보세요</span>
    </span>
  )

  // 버튼은 가로를 꽉 채워 가운데 정렬(두 개면 반씩)
  const footer = (
    <div className={styles.actions}>
      {variant === 'prompt' ? (
        <>
          <Button variant="outline" onClick={onClose}>
            다음에
          </Button>
          <Button onClick={onInstall}>설치하기</Button>
        </>
      ) : variant === 'ios' ? (
        <Button onClick={onClose}>알겠어요</Button>
      ) : (
        <>
          <Button variant="outline" onClick={onClose}>
            다음에
          </Button>
          {externalUrl ? (
            <Button onClick={onOpenExternal}>브라우저로 열기</Button>
          ) : (
            <Button onClick={handleCopy}>{copied === 'done' ? '복사했어요' : '주소 복사'}</Button>
          )}
        </>
      )}
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      <p className={styles.lead}>
        {variant === 'openInBrowser' ? `${browserName}에서 열어야 설치할 수 있어요.` : '홈 화면에서 바로 열 수 있어요.'}
      </p>
      {variant === 'ios' && (
        <ol className={styles.steps}>
          <li>
            <span className={styles.stepIcon}>
              <ShareIcon />
            </span>
            <span>
              <b className={styles.strong}>공유</b> 누르기
            </span>
          </li>
          <li>
            <span className={styles.stepIcon}>
              <AddToHomeIcon />
            </span>
            <span>
              <b className={styles.strong}>홈 화면에 추가</b> 고르기
            </span>
          </li>
          <li>
            <span className={styles.stepIcon}>
              <CheckIcon />
            </span>
            <span>
              <b className={styles.strong}>추가</b> 누르기
            </span>
          </li>
        </ol>
      )}
      {copied === 'failed' && (
        <p className={styles.warning} role="alert">
          복사하지 못했어요. 주소창에서 복사해 주세요.
        </p>
      )}
    </Modal>
  )
}
