import { useEffect, useRef, useState } from 'react'
import { discardChallenge, getChallenge, loadGoogleIdentityScript } from './googleIdentity'
import styles from './GoogleIdentityButton.module.css'

interface GoogleIdentityButtonProps {
  clientId: string
  onCredential: (credential: string) => void
  disabled?: boolean
}

export function GoogleIdentityButton({ clientId, onCredential, disabled = false }: GoogleIdentityButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const credentialHandler = useRef(onCredential)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    credentialHandler.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let active = true
    let resizeObserver: ResizeObserver | undefined
    const container = containerRef.current
    if (!container) return

    const renderButton = () => {
      const google = window.google?.accounts.id
      const width = Math.floor(container.clientWidth)
      if (!active || !google || width < 1) return
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

    // challenge 를 받아 GIS 를 (다시) 초기화한다. 로그인 한 번마다 새 nonce 가 필요해서, 인증 정보를 받으면 바로 다음 것을 준비한다
    const prepare = async () => {
      const [, challenge] = await Promise.all([loadGoogleIdentityScript(), getChallenge()])
      if (!active) return
      const google = window.google?.accounts.id
      if (!google) throw new Error('Google 로그인 스크립트를 불러오지 못했어요.')
      google.initialize({
        client_id: clientId,
        nonce: challenge.nonce,
        ux_mode: 'popup',
        callback: ({ credential }) => {
          discardChallenge()
          if (credential) credentialHandler.current(credential)
          else setError('Google 인증 정보를 받지 못했어요. 다시 시도해 주세요.')
          // 이번 로그인이 실패해 다시 누를 때를 위해 다음 nonce 로 다시 준비(버튼은 그대로 둔다)
          void prepare().catch(() => {})
        },
      })
      if (!resizeObserver) {
        renderButton()
        resizeObserver = new ResizeObserver(renderButton)
        resizeObserver.observe(container)
        setReady(true)
      }
    }

    setError('')
    prepare().catch((reason: unknown) => {
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
      <div className={styles.slot}>
        {/* 버튼이 그려지기 전 같은 크기의 자리 — 늦게 떠도 아래가 밀리지 않는다 */}
        {!ready && !error && <div className={styles.placeholder} aria-hidden="true" />}
        <div
          ref={containerRef}
          className={styles.button}
          aria-label="Google로 계속하기"
          aria-disabled={disabled}
          data-disabled={disabled || undefined}
        />
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  )
}
