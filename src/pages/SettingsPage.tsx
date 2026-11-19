import { GoogleContinueButton, SettingsForm, useMyInfo } from '@/features/account'
import { BackButton, Button, Header } from '@/shared/ui'
import styles from './SettingsPage.module.css'

export interface SettingsPageProps {
  /** 뒤로가기 화살표 — 들어온 화면으로 */
  onBack?: () => void
  /** "계정 바꾸기"의 Google로 계속하기 — 지금은 로그인 화면으로 */
  onSwitchAccount?: () => void
}

/** "설정"(시안 290:891·290:774): 계정 바꾸기, 내 정보(닉네임·나이대) 수정, 야간 알림. 탭바 없음. */
export default function SettingsPage({ onBack, onSwitchAccount }: SettingsPageProps) {
  const { state, retry } = useMyInfo()

  return (
    <main className={styles.page} aria-busy={state.status === 'loading'}>
      <Header className={styles.header} title="설정" />
      <BackButton className={styles.back} onClick={onBack} />

      <section className={styles.account} aria-labelledby="settings-account">
        <h2 id="settings-account" className={styles.heading}>
          계정 바꾸기
        </h2>
        <GoogleContinueButton className={styles.google} onClick={onSwitchAccount} />
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
    </main>
  )
}
