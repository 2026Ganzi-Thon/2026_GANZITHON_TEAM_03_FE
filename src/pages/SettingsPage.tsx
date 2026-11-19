import { useState } from 'react'
import { GoogleContinueButton, SettingsForm, useMyInfo } from '@/features/account'
import { BackButton, Button, Header, Modal } from '@/shared/ui'
import styles from './SettingsPage.module.css'

export interface SettingsPageProps {
  /** 뒤로가기 화살표 — 들어온 화면으로 */
  onBack?: () => void
  /** "계정 바꾸기"의 Google로 계속하기 — 지금은 로그인 화면으로 */
  onSwitchAccount?: () => void
  /** 로그아웃 확인 뒤 — 서버 로그아웃 후 로그인 화면으로 */
  onLogout?: () => Promise<void>
}

/** "설정"(시안 290:891·290:774): 계정 바꾸기·로그아웃, 내 정보(닉네임·나이대) 수정, 야간 알림. 탭바 없음. */
export default function SettingsPage({ onBack, onSwitchAccount, onLogout }: SettingsPageProps) {
  const { state, retry } = useMyInfo()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const confirmLogout = async () => {
    setLoggingOut(true)
    // 서버 호출이 실패해도 이 기기에서는 로그아웃된다(session.ts logout) — 세션이 닫히면 로그인 화면으로 바뀐다
    await onLogout?.()
  }

  return (
    <main className={styles.page} aria-busy={state.status === 'loading'}>
      <Header className={styles.header} title="설정" />
      <BackButton className={styles.back} onClick={onBack} />

      <section className={styles.account} aria-labelledby="settings-account">
        <h2 id="settings-account" className={styles.heading}>
          계정 바꾸기
        </h2>
        <GoogleContinueButton className={styles.google} onClick={onSwitchAccount} />
        {/* 임의 결정(확인 필요): 로그아웃 — 시안 없음. 계정 바꾸기 바로 아래 글자 버튼, 누르면 확인 창 */}
        <Button variant="ghost" size="sm" className={styles.logout} onClick={() => setLogoutOpen(true)}>
          로그아웃
        </Button>
      </section>

      {/* 임의 결정(확인 필요): 불러오기 실패 안내·다시 시도 — 시안 없음, 치즈 보관함과 같은 수준. 계정 바꾸기는 그대로 둔다 */}
      {state.status === 'error' ? (
        <div className={styles.status} role="alert">
          <p className={styles.message}>내 정보를 불러오지 못했어요.</p>
          <Button variant="outline" size="sm" onClick={retry}>
            다시 시도
          </Button>
        </div>
      ) : (
        // 받은 뒤에는 새로 시작해 입력값을 받은 값으로 채운다
        <SettingsForm
          key={state.status}
          info={state.status === 'success' ? state.data : null}
        />
      )}

      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        closeOnBackdrop={!loggingOut}
        title="로그아웃할까요?"
        footer={
          <>
            <Button variant="outline" size="sm" disabled={loggingOut} onClick={() => setLogoutOpen(false)}>
              취소
            </Button>
            <Button size="sm" disabled={loggingOut} onClick={() => void confirmLogout()}>
              {loggingOut ? '로그아웃 중…' : '로그아웃'}
            </Button>
          </>
        }
      >
        <p>다시 들어오려면 로그인해야 해요.</p>
      </Modal>
    </main>
  )
}
