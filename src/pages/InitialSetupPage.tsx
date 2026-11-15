import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCompleteInitialProfile } from '@/features/account'
import { BackButton, Button, Checkbox, Icon, Select, TextField } from '@/shared/ui'
import styles from './InitialSetupPage.module.css'

type ConsentKey = 'terms' | 'privacy' | 'marketing'
type ChannelKey = 'push' | 'email' | 'sms'

const consentLabels: Record<ConsentKey, { marker: string; label: string }> = {
  terms: { marker: '필수', label: '서비스 이용약관' },
  privacy: { marker: '필수', label: '개인정보 처리방침' },
  marketing: { marker: '선택', label: '마케팅 및 광고성 정보 수신 동의' },
}

export interface InitialSetupPageProps {
  onBack: () => void
  onLogin: () => void
  onComplete: () => void
}

export default function InitialSetupPage({ onBack, onLogin, onComplete }: InitialSetupPageProps) {
  const profile = useCompleteInitialProfile()
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState('20대')
  const [nicknameMessage, setNicknameMessage] = useState('')
  const [consents, setConsents] = useState<Record<ConsentKey, boolean>>({
    terms: false,
    privacy: false,
    marketing: false,
  })
  const [channels, setChannels] = useState<Record<ChannelKey, boolean>>({
    push: false,
    email: false,
    sms: false,
  })

  const allAgreed = Object.values(consents).every(Boolean) && Object.values(channels).every(Boolean)
  const setAll = (checked: boolean) => {
    setConsents({ terms: checked, privacy: checked, marketing: checked })
    setChannels({ push: checked, email: checked, sms: checked })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (profile.state.status === 'submitting') return
    if (!consents.terms || !consents.privacy) return
    if (nickname.trim().length < 2 || nickname.trim().length > 8) {
      setNicknameMessage('닉네임을 2~8자로 입력해주세요.')
      return
    }
    // 임의 결정(확인 필요): 저장 실패 안내는 닉네임 안내 자리에 한 줄로 — 시안에 없음
    if (await profile.submit({ nickname: nickname.trim(), ageGroup: age })) onComplete()
    else setNicknameMessage('저장하지 못했어요. 잠시 뒤 다시 시도해주세요.')
  }

  return (
    <main className={styles.page} aria-label="초기 설정">
      <div className={styles.topBar}>
        <BackButton className={styles.back} aria-label="뒤로 가기" onClick={onBack} />
      </div>

      <header className={styles.heading}>
        <h1>회원가입</h1>
        <p>계정을 만들어주세요</p>
      </header>

      <form id="setup-form" className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.nicknameGroup}>
          <TextField
            className={styles.nickname}
            label="닉네임"
            name="nickname"
            placeholder="닉네임을 입력해주세요 (2~8자)"
            value={nickname}
            onChange={(event) => {
              setNickname(event.currentTarget.value)
              setNicknameMessage('')
            }}
            minLength={2}
            maxLength={8}
            required
            endAdornment={
              <Button
                type="button"
                variant="primary"
                size="sm"
                className={styles.nicknameCheck}
                onClick={() => setNicknameMessage(
                  nickname.trim().length >= 2 && nickname.trim().length <= 8
                    ? '중복 확인은 서버 연동 후 사용할 수 있어요.'
                    : '닉네임을 2~8자로 입력해주세요.',
                )}
              >
                닉네임 중복확인
              </Button>
            }
          />
          {nicknameMessage && <p className={styles.nicknameMessage} role="status">{nicknameMessage}</p>}
        </div>

        <Select
          className={styles.age}
          label="나이대"
          name="age"
          value={age}
          onChange={(event) => setAge(event.currentTarget.value)}
        >
          <option value="10대">10대</option>
          <option value="20대">20대</option>
          <option value="30대">30대</option>
          <option value="40대">40대</option>
          <option value="50대 이상">50대 이상</option>
        </Select>

        <section className={styles.consents} aria-labelledby="consent-heading">
          <h2 id="consent-heading">서비스 이용약관에 동의해주세요</h2>
          <Checkbox
            className={styles.allConsent}
            checked={allAgreed}
            onChange={(event) => setAll(event.currentTarget.checked)}
          >
            전체 동의하기
          </Checkbox>

          <div className={styles.consentList}>
            {(Object.keys(consentLabels) as ConsentKey[]).map((key) => (
              <div className={styles.consentRow} key={key}>
                <Checkbox
                  checked={consents[key]}
                  onChange={(event) => setConsents((current) => ({ ...current, [key]: event.currentTarget.checked }))}
                >
                  <span className={key === 'marketing' ? styles.optional : styles.required}>
                    [{consentLabels[key].marker}]
                  </span>
                  {' '}{consentLabels[key].label}
                </Checkbox>
                <button className={styles.detail} type="button" aria-label={`${consentLabels[key].label} 보기`}>
                  {/* 임의 결정(확인 필요): 시안 화살표(높이 8, 2px 선)와 같은 아이콘이 없어 공용 chevron-right 를 10px 로 줄여 씀 */}
                  <Icon name="chevron-right" size={10} />
                </button>
              </div>
            ))}
          </div>

          <p className={styles.channelHeading}>수신 방법</p>
          <div className={styles.channels}>
            <Checkbox checked={channels.push} onChange={(event) => setChannels((current) => ({ ...current, push: event.currentTarget.checked }))}>앱 PUSH</Checkbox>
            <Checkbox checked={channels.email} onChange={(event) => setChannels((current) => ({ ...current, email: event.currentTarget.checked }))}>이메일</Checkbox>
            <Checkbox checked={channels.sms} onChange={(event) => setChannels((current) => ({ ...current, sms: event.currentTarget.checked }))}>SMS/MMS</Checkbox>
          </div>
        </section>

      </form>

      <Button className={styles.submit} variant="primary" size="lg" fullWidth type="submit" form="setup-form" disabled={profile.state.status === 'submitting'}>
        회원가입
      </Button>

      <p className={styles.footer}>
        <span>이미 계정이 있으신가요?</span>
        <button type="button" onClick={onLogin}>로그인</button>
      </p>
    </main>
  )
}
