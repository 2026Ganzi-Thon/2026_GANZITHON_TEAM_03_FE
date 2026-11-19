import { useEffect, useRef, useState } from 'react'
import { createGoogleLoginChallenge } from './googleAuth'
import styles from './GoogleIdentityButton.module.css'

interface GoogleCredentialResponse {
  credential?: string
}

interface GoogleButtonOptions {
  theme: 'outline'
  size: 'large'
  text: 'continue_with'
  shape: 'rectangular'
  logo_alignment: 'left'
  width: number
  locale: 'ko'
}

interface GoogleIdentityApi {
  initialize(options: {
    client_id: string
    nonce: string
    callback: (response: GoogleCredentialResponse) => void
    ux_mode: 'popup'
  }): void
  renderButton(element: HTMLElement, options: GoogleButtonOptions): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentityApi } }
  }
}

let scriptPromise: Promise<void> | undefined

function loadGoogleIdentityScript() {
  if (window.google?.accounts.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('#google-identity-services')
    const script = existing ?? document.createElement('script')

    const handleLoad = () => {
      if (window.google?.accounts.id) resolve()
      else reject(new Error('Google 로그인 스크립트를 불러오지 못했어요.'))
    }
    const handleError = () => {
      script.remove()
      reject(new Error('Google 로그인 스크립트를 불러오지 못했어요.'))
    }

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
    if (!existing) {
      script.id = 'google-identity-services'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.append(script)
    }
  }).catch((error: unknown) => {
    scriptPromise = undefined
    throw error
  })

  return scriptPromise
}

interface GoogleIdentityButtonProps {
  clientId: string
  onCredential: (credential: string) => void
  disabled?: boolean
}

export function GoogleIdentityButton({ clientId, onCredential, disabled = false }: GoogleIdentityButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const credentialHandler = useRef(onCredential)
  const [error, setError] = useState('')

  useEffect(() => {
    credentialHandler.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let active = true
    let resizeObserver: ResizeObserver | undefined
    const container = containerRef.current
    if (!container) return

    setError('')
    void Promise.all([loadGoogleIdentityScript(), createGoogleLoginChallenge()])
      .then(([, challenge]) => {
        if (!active || !containerRef.current) return
        const google = window.google?.accounts.id
        if (!google) throw new Error('Google 로그인 스크립트를 불러오지 못했어요.')

        google.initialize({
          client_id: clientId,
          nonce: challenge.nonce,
          ux_mode: 'popup',
          callback: ({ credential }) => {
            if (credential) credentialHandler.current(credential)
            else setError('Google 인증 정보를 받지 못했어요. 다시 시도해 주세요.')
          },
        })

        const renderButton = () => {
          const width = Math.floor(container.clientWidth)
          if (!active || width < 1) return
          container.replaceChildren()
          google.renderButton(container, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width,
            locale: 'ko',
          })
        }

        renderButton()
        resizeObserver = new ResizeObserver(renderButton)
        resizeObserver.observe(container)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Google 로그인을 준비하지 못했어요.')
      })

    return () => {
      active = false
      resizeObserver?.disconnect()
      container.replaceChildren()
    }
  }, [clientId])

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={styles.button}
        aria-label="Google로 계속하기"
        aria-disabled={disabled}
        data-disabled={disabled || undefined}
      />
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  )
}
