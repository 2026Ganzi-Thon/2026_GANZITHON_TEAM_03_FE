import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import { cx } from '@/shared/lib/cx'
import { Button, Select, TextField, Toggle } from '@/shared/ui'
import { MarketingConsent } from './MarketingConsent'
import { loadNightAlarm, saveNightAlarm } from './nightAlarm'
import { normalizeNickname } from './nickname'
import { useNicknameCheck } from './useNicknameCheck'
import { useUpdateMyInfo } from './useUpdateMyInfo'
import type { MyInfo, NicknameCheckState, UpdateProfileRequest } from './types'
import styles from './SettingsForm.module.css'

/** 초기 설정 화면과 같은 선택지. 화면 값을 그대로 `ageGroup` 으로 보낸다(코드 목록 미정 — docs/decisions.md) */
const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대 이상']
/** 시안 폭(75px)에 글자가 다 안 들어가는 선택지 */
const WIDE_AGE_GROUP = '50대 이상'

/** 저장 성공 안내를 보여주는 시간 */
const SAVED_NOTICE_MS = 2500

const CHECK_MESSAGES: Partial<Record<NicknameCheckState['status'], { text: string; error: boolean }>> = {
  available: { text: '사용 가능한 닉네임입니다.', error: false },
  taken: { text: '이미 사용 중인 닉네임입니다.', error: true },
  invalid: { text: '닉네임은 한글·영문·숫자·밑줄(_)로 2~8자 입력해주세요.', error: true },
  error: { text: '확인하지 못했어요. 잠시 뒤 다시 시도해주세요.', error: true },
}

export interface SettingsFormProps {
  /** 내 정보. 받는 중이면 null(값 자리를 비우고 저장을 막는다). 받은 뒤 새로 시작하려면 쓰는 쪽이 key 를 바꾼다 */
  info: MyInfo | null
}

/**
 * 설정의 "내 정보 수정하기"·"알림 설정"·"저장하기"(시안 290:891, 닉네임 수정 상태 290:774).
 * 닉네임은 "닉네임 수정하기"로 입력칸을 열고 중복확인을 통과해야 저장된다. 저장은 바뀐 항목만 보낸다.
 */
export function SettingsForm({ info }: SettingsFormProps) {
  const update = useUpdateMyInfo()
  const nicknameCheck = useNicknameCheck()
  const nicknameInputRef = useRef<HTMLInputElement>(null)

  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  /** 중복확인 없이 저장을 눌렀을 때 */
  const [needsCheck, setNeedsCheck] = useState(false)
  const [ageGroup, setAgeGroup] = useState(info?.ageGroup ?? '')
  const [savedNightAlarm, setSavedNightAlarm] = useState(loadNightAlarm)
  const [nightAlarm, setNightAlarm] = useState(savedNightAlarm)
  const [saveNotice, setSaveNotice] = useState<'saved' | 'error' | null>(null)

  const currentNickname = info?.nickname ?? ''
  const nextNickname = normalizeNickname(nicknameInput)
  // 임의 결정(확인 필요): 입력칸을 비워 두거나 지금 닉네임과 같으면 닉네임은 바꾸지 않은 것으로 본다(수정 상태를 열기만 한 경우)
  const nicknameChanged = editingNickname && nextNickname !== '' && nextNickname !== currentNickname
  const ageChanged = info !== null && ageGroup !== (info.ageGroup ?? '')
  const nightAlarmChanged = nightAlarm !== savedNightAlarm
  const dirty = nicknameChanged || ageChanged || nightAlarmChanged
  const submitting = update.state.status === 'submitting'
  const checking = nicknameCheck.state.status === 'checking'

  // 임의 결정(확인 필요): 저장 성공은 저장하기 버튼 위 한 줄 "저장했어요."로 2.5초 알린다 — 시안 없음, 토스트 공용 컴포넌트가 없어 다른 화면의 한 줄 안내 수준
  useEffect(() => {
    if (saveNotice !== 'saved') return
    const timer = window.setTimeout(() => setSaveNotice(null), SAVED_NOTICE_MS)
    return () => window.clearTimeout(timer)
  }, [saveNotice])

  /** 무언가 바꾸면 지난 저장 결과 안내는 지운다 */
  const touched = () => {
    if (saveNotice) setSaveNotice(null)
  }

  const startEditing = () => {
    touched()
    setEditingNickname(true)
  }

  // 임의 결정(확인 필요): 수정 상태의 취소 버튼은 시안에 없어 따로 두지 않음 — Esc 를 누르거나, 비워 둔 채 저장하면(다른 항목만 저장) 보기 상태로 돌아간다
  const stopEditing = () => {
    setEditingNickname(false)
    setNicknameInput('')
    setNeedsCheck(false)
    nicknameCheck.reset()
  }

  const runCheck = () => {
    setNeedsCheck(false)
    void nicknameCheck.check(nicknameInput)
  }

  const handleNicknameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      stopEditing()
    } else if (event.key === 'Enter') {
      // 입력칸에서 Enter 는 저장 대신 중복확인
      event.preventDefault()
      if (!checking) runCheck()
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!info || submitting || !dirty) return
    setSaveNotice(null)

    const body: UpdateProfileRequest = {}
    if (nicknameChanged) {
      if (nicknameCheck.state.status !== 'available') {
        // 확인 결과가 이미 보이면(이미 사용 중·형식 오류) 그 안내를 그대로 두고, 확인 전이면 중복확인을 하라고 알린다
        if (nicknameCheck.state.status === 'idle' || nicknameCheck.state.status === 'error') setNeedsCheck(true)
        nicknameInputRef.current?.focus()
        return
      }
      body.nickname = nextNickname
    }
    if (ageChanged) body.ageGroup = ageGroup || null

    if (Object.keys(body).length > 0) {
      const result = await update.submit(body)
      if (!result) return
      if (body.nickname !== undefined && (result.status === 'duplicated' || result.status === 'invalid')) {
        // 확인 뒤 다른 사람이 먼저 가져갔거나(확인은 예약이 아님) 형식이 서버와 다를 때
        nicknameCheck.markFailed(result.status === 'duplicated' ? 'taken' : 'invalid')
        nicknameInputRef.current?.focus()
        return
      }
      if (result.status !== 'success') {
        setSaveNotice('error')
        return
      }
    }

    // 프로필 저장이 끝난 뒤에(또는 바꿀 프로필이 없을 때) 기기에 저장 — 실패한 저장에 알림만 반영되지 않게
    if (nightAlarmChanged) {
      saveNightAlarm(nightAlarm)
      setSavedNightAlarm(nightAlarm)
    }
    stopEditing()
    setSaveNotice('saved')
  }

  const checkMessage = needsCheck
    ? { text: '닉네임 중복확인을 해주세요.', error: true }
    : CHECK_MESSAGES[nicknameCheck.state.status]
  let nicknameHint: ReactNode
  let nicknameError: ReactNode
  if (checkMessage?.error) nicknameError = checkMessage.text
  else if (checkMessage) nicknameHint = <span className={styles.available}>{checkMessage.text}</span>

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <section className={styles.section} aria-labelledby="settings-profile">
        <h2 id="settings-profile" className={styles.heading}>
          내 정보 수정하기
        </h2>

        {editingNickname ? (
          <TextField
            ref={nicknameInputRef}
            className={styles.nicknameField}
            label="닉네임"
            name="nickname"
            placeholder="닉네임을 입력해주세요 (2~8자)"
            autoComplete="off"
            maxLength={8}
            autoFocus
            value={nicknameInput}
            onChange={(event) => {
              touched()
              setNicknameInput(event.currentTarget.value)
              setNeedsCheck(false)
              // 입력이 바뀌면 지난 확인 결과는 버린다
              nicknameCheck.reset()
            }}
            onKeyDown={handleNicknameKeyDown}
            hint={nicknameHint}
            error={nicknameError}
            endAdornment={
              <Button
                type="button"
                size="sm"
                className={styles.nicknameButton}
                disabled={checking || submitting}
                onClick={runCheck}
              >
                닉네임 중복확인
              </Button>
            }
          />
        ) : (
          <div className={styles.nicknameView}>
            <p className={styles.label}>닉네임</p>
            <div className={styles.nicknameRow}>
              {info ? (
                <span className={styles.nickname}>{currentNickname}</span>
              ) : (
                <span className={styles.skeleton} aria-hidden="true" />
              )}
              <Button
                type="button"
                size="sm"
                className={styles.nicknameButton}
                disabled={!info || submitting}
                onClick={startEditing}
              >
                닉네임 수정하기
              </Button>
            </div>
          </div>
        )}

        <Select
          className={cx(styles.age, ageGroup === WIDE_AGE_GROUP && styles.ageWide)}
          label="나이대"
          name="ageGroup"
          value={ageGroup}
          disabled={!info || submitting}
          onChange={(event) => {
            touched()
            setAgeGroup(event.currentTarget.value)
          }}
        >
          {/* 임의 결정(확인 필요): 나이대를 아직 안 고른 사용자는 "선택"이 보이고, 고르지 않으면 보내지 않는다 */}
          {ageGroup === '' && (
            <option value="" disabled>
              {info ? '선택' : ''}
            </option>
          )}
          {AGE_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </Select>
      </section>

      <section className={styles.section} aria-labelledby="settings-alarm">
        <h2 id="settings-alarm" className={styles.heading}>
          알림 설정
        </h2>
        <Toggle
          className={styles.alarm}
          name="nightAlarm"
          checked={nightAlarm}
          disabled={!info || submitting}
          onChange={(event) => {
            touched()
            setNightAlarm(event.currentTarget.checked)
          }}
        >
          야간 알림 (22:00~07:00)
        </Toggle>
        <MarketingConsent />
      </section>

      <div className={styles.footer}>
        <p className={saveNotice === 'error' ? styles.noticeError : styles.notice} role="status">
          {saveNotice === 'saved' && '저장했어요.'}
          {saveNotice === 'error' && '저장하지 못했어요. 잠시 뒤 다시 시도해주세요.'}
        </p>
        <Button type="submit" size="md" fullWidth disabled={!info || !dirty || submitting}>
          저장하기
        </Button>
      </div>
    </form>
  )
}
