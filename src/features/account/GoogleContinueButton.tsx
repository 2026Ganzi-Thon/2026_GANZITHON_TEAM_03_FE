import type { ComponentPropsWithoutRef } from 'react'
import { cx } from '@/shared/lib/cx'
import googleLogo from '@/assets/images/google-original.png'
import styles from './GoogleContinueButton.module.css'

export type GoogleContinueButtonProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'>

/**
 * "Google로 계속하기" 버튼 — 로그인 화면(pages/AuthPage)의 버튼과 같은 모양(시안 290:914).
 * 로그인 화면은 이번에 고치지 않아(팀원 feature/google-login 작업 중) 스타일을 여기 따로 두었다 — 공용 승격 후보.
 */
export function GoogleContinueButton({ className, type = 'button', ...rest }: GoogleContinueButtonProps) {
  return (
    <button type={type} className={cx(styles.google, className)} {...rest}>
      <img className={styles.mark} src={googleLogo} alt="" aria-hidden="true" />
      <span>Google로 계속하기</span>
    </button>
  )
}
