import { useState } from 'react'
import type { FormEvent } from 'react'
import { COMMON_INVALID_REQUEST, USER_NICKNAME_DUPLICATED, useCompleteInitialProfile } from '@/features/account'
import { hasErrorCode } from '@/shared/api'
import { BackButton, Button, Checkbox, Icon, Select, TextField } from '@/shared/ui'
import styles from './InitialSetupPage.module.css'

type ConsentKey = 'terms' | 'privacy' | 'marketing'
type ChannelKey = 'push' | 'email' | 'sms'

export interface InitialSetupValues {
  nickname: string
  ageGroup: string
  consents: Record<ConsentKey, boolean>
  channels: Record<ChannelKey, boolean>
}

const channelLabels: Record<ChannelKey, string> = { push: '앱 PUSH', email: '이메일', sms: 'SMS/MMS' }

const consentLabels: Record<ConsentKey, { marker: string; label: string }> = {
  terms: { marker: '필수', label: '서비스 이용약관' },
  privacy: { marker: '필수', label: '개인정보 처리방침' },
  marketing: { marker: '선택', label: '마케팅 및 광고성 정보 수신 동의' },
}

export interface InitialSetupPageProps {
  onBack: () => void
  onLogin: () => void
  onComplete: (values: InitialSetupValues) => void | Promise<void>
  /** 프로필 저장 전에 할 일(가입 등). false 면 멈춘다 */
  onBeforeComplete?: (values: InitialSetupValues) => boolean | Promise<boolean>
  /** 닉네임 사용 가능 여부. null 이면 아직 확인할 수 없음(가입 전이라 토큰 없음) — 저장할 때 서버가 확인한다 */
  onCheckNickname?: (nickname: string) => Promise<boolean | null>
  requiresConsent?: boolean
  consentNotice?: string
  isSubmitting?: boolean
  submissionError?: string
  /** 제출 오류 아래에 붙는 이어갈 동작(예: 인증 메일 다시 받기) */
  submissionAction?: { label: string; onClick: () => void }
}

export default function InitialSetupPage({
  onBack,
  onLogin,
  onComplete,
  onBeforeComplete,
  onCheckNickname,
  requiresConsent = true,
  consentNotice,
  isSubmitting = false,
  submissionError = '',
  submissionAction,
}: InitialSetupPageProps) {
  const profile = useCompleteInitialProfile()
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState('20대')
  const [nicknameMessage, setNicknameMessage] = useState('')
  const [nicknameChecking, setNicknameChecking] = useState(false)
  const [formError, setFormError] = useState('')
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
    setFormError('')
    if (profile.state.status === 'submitting' || isSubmitting) return
    if (requiresConsent && (!consents.terms || !consents.privacy)) {
      setFormError('필수 약관에 동의해주세요.')
      return
    }
    if (nickname.trim().length < 2 || nickname.trim().length > 8) {
      setNicknameMessage('닉네임을 2~8자로 입력해주세요.')
      return
    }

    const values: InitialSetupValues = { nickname: nickname.trim(), ageGroup: age, consents, channels }
    if (onBeforeComplete && !(await onBeforeComplete(values))) return
    const saved = await profile.submit({ nickname: values.nickname, ageGroup: age })
    if (!saved.ok) {
      if (hasErrorCode(saved.error, USER_NICKNAME_DUPLICATED)) {
        setNicknameMessage('이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해주세요.')
      } else if (hasErrorCode(saved.error, COMMON_INVALID_REQUEST)) {
        setNicknameMessage('닉네임은 한글·영문·숫자·_ 2~8자로 입력해주세요.')
      } else if (saved.error !== undefined) {
        setFormError('프로필을 저장하지 못했어요. 잠시 뒤 다시 시도해주세요.')
      }
      return
    }
    await onComplete(values)
  }

  const handleNicknameCheck = async () => {
    const value = nickname.trim()
    if (value.length < 2 || value.length > 8) {
      setNicknameMessage('닉네임을 2~8자로 입력해주세요.')
      return
    }
    if (!onCheckNickname) {
      setNicknameMessage('중복 확인은 서버 연결 후 사용할 수 있어요.')
      return
    }
    setNicknameChecking(true)
    try {
      const available = await onCheckNickname(value)
      setNicknameMessage(
        available === null
          ? '회원가입을 누르면 닉네임 중복도 함께 확인해요.'
          : available
            ? '사용할 수 있는 닉네임이에요.'
            : '이미 사용 중인 닉네임이에요.',
      )
    } catch {
      setNicknameMessage('중복 확인을 하지 못했어요. 다시 시도해주세요.')
    } finally {
      setNicknameChecking(false)
    }
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

      {consentNotice && <p className={styles.consentNotice}>{consentNotice}</p>}

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
              setFormError('')
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
                disabled={nicknameChecking || isSubmitting || profile.state.status === 'submitting'}
                onClick={() => void handleNicknameCheck()}
              >
                {nicknameChecking ? '확인 중' : '닉네임 중복확인'}
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

        {requiresConsent && <section className={styles.consents} aria-labelledby="consent-heading">
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
                  onChange={(event) => {
                    // 업데이트 함수는 나중에 실행돼 그때는 event.currentTarget 이 null — 값을 먼저 읽는다
                    const checked = event.currentTarget.checked
                    setConsents((current) => ({ ...current, [key]: checked }))
                  }}
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
            {(Object.keys(channelLabels) as ChannelKey[]).map((key) => (
              <Checkbox
                key={key}
                checked={channels[key]}
                onChange={(event) => {
                  const checked = event.currentTarget.checked
                  setChannels((current) => ({ ...current, [key]: checked }))
                }}
              >
                {channelLabels[key]}
              </Checkbox>
            ))}
          </div>
        </section>}

      </form>

      {(formError || submissionError) && (
        <p className={styles.formError} role="alert">
          {formError || submissionError}
          {!formError && submissionAction && (
            <button className={styles.errorAction} type="button" onClick={submissionAction.onClick}>
              {submissionAction.label}
            </button>
          )}
        </p>
      )}
      <Button className={styles.submit} variant="primary" size="lg" fullWidth type="submit" form="setup-form" disabled={isSubmitting || profile.state.status === 'submitting'}>
        회원가입
      </Button>

      <p className={styles.footer}>
        <span>이미 계정이 있으신가요?</span>
        <button type="button" onClick={onLogin}>로그인</button>
      </p>
    </main>
  )
}
