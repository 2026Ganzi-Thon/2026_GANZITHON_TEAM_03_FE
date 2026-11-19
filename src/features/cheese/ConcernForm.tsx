import { useId, useState } from 'react'
import { containsProfanity } from '@/shared/lib/profanity'
import { Button, Chip, TextArea, TextField } from '@/shared/ui'
import { CONCERN_MAX_LENGTH, CONCERN_TITLE_MAX_LENGTH } from './cheeseApi'
import { COMFORT_TYPE_LABELS } from './concernText'
import type { ComfortType } from './types'
import styles from './ConcernForm.module.css'

export interface ConcernFormProps {
  submitting?: boolean
  /** 버튼 위 안내(저장 실패 등). 자리는 늘 잡혀 있어 생기고 사라져도 버튼이 움직이지 않는다 */
  notice?: string
  onSubmit: (values: { title: string; content: string; comfortType: ComfortType }) => void
}

const COMFORT_TYPES: ComfortType[] = ['EMPATHY', 'EXPERIENCE', 'ADVICE']

const PROFANITY_MESSAGE = '다른 폴리가 상처받을 수 있는 표현이 있어요. 조금만 다듬어 주세요.'

/** 서버로 보낼 제목: 한 줄이어야 해서(제어 문자면 서버 400) 붙여 넣은 탭 등 제어 문자는 공백으로 바꾸고 앞뒤 공백을 뺀다 */
function toTitle(title: string): string {
  return title.replace(/\p{Cc}/gu, ' ').trim()
}

/** 코드 포인트 글자 수(서버와 같은 기준 — 이모지 하나가 한 글자) */
const countChars = (text: string) => Array.from(text).length

/**
 * 고민 쓰기 폼(시안 없음): 제목(한 줄) + 받고 싶은 위로 방식(하나) + 내용 + 공개 안내 + `고민 남기기`.
 * 제목·위로 방식·내용이 모두 있어야 보낼 수 있다(백엔드: 제목 1~50자, 내용 1~1000자, 둘 다 앞뒤 공백 제외).
 * 제출할 때만 비속어를 검사해 걸리면 보내지 않는다(위로 쓰기 ReplyForm 과 같은 방식).
 * 임의 결정(확인 필요): 화면 구성·문구 전부 — 시안에 고민 쓰기 화면이 없어 양 먹이주기(EmotionWritePage)·위로 쓰기 톤으로 만들었다.
 */
export function ConcernForm({ submitting, notice, onSubmit }: ConcernFormProps) {
  const comfortLabelId = useId()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [comfortType, setComfortType] = useState<ComfortType | null>(null)
  const [checking, setChecking] = useState(false)
  const [profane, setProfane] = useState(false)

  const cleanTitle = toTitle(title)
  const content = body.trim()
  const length = countChars(content)
  const tooLong = length > CONCERN_MAX_LENGTH
  const titleTooLong = countChars(cleanTitle) > CONCERN_TITLE_MAX_LENGTH
  const canSubmit =
    cleanTitle !== '' && !titleTooLong && comfortType !== null && content !== '' && !tooLong && !submitting && !checking

  const handleSubmit = async () => {
    if (!comfortType) return
    setChecking(true)
    try {
      if (await containsProfanity(`${cleanTitle}\n${content}`)) {
        setProfane(true)
        return
      }
    } catch {
      // 검사 모듈을 못 불러오면(오프라인 등) 막지 않는다
    } finally {
      setChecking(false)
    }
    onSubmit({ title: cleanTitle, content, comfortType })
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) void handleSubmit()
      }}
    >
      <TextField
        label="고민 제목"
        placeholder="고민을 한 줄로 적어주세요"
        value={title}
        maxLength={CONCERN_TITLE_MAX_LENGTH}
        enterKeyHint="next"
        onChange={(event) => {
          setTitle(event.target.value)
          setProfane(false)
        }}
      />

      <div className={styles.comfort} role="group" aria-labelledby={comfortLabelId}>
        <p id={comfortLabelId} className={styles.label}>
          어떤 위로를 받고 싶나요?
        </p>
        <div className={styles.chips}>
          {COMFORT_TYPES.map((type) => (
            <Chip key={type} selected={comfortType === type} onClick={() => setComfortType(type)}>
              {COMFORT_TYPE_LABELS[type]}
            </Chip>
          ))}
        </div>
      </div>

      <TextArea
        label="고민 내용"
        placeholder="나누고 싶은 고민을 적어주세요."
        rows={8}
        className={styles.body}
        value={body}
        error={profane ? PROFANITY_MESSAGE : tooLong ? `${CONCERN_MAX_LENGTH.toLocaleString()}자까지 쓸 수 있어요` : undefined}
        hint={`${length.toLocaleString()} / ${CONCERN_MAX_LENGTH.toLocaleString()}자`}
        onChange={(event) => {
          setBody(event.target.value)
          setProfane(false)
        }}
      />

      {/* C02-1 공개 안내 — 숙성 시간은 서버 설정(기본 24시간)이라 "하루"로 적는다 */}
      <p className={styles.guide}>
        고민은 이름 없이 다른 섬의 폴리들에게 보여요.
        <br />
        하루 동안 숙성되며 위로를 모으고, 숙성이 끝나면 치즈를 열어 받은 위로를 볼 수 있어요.
      </p>

      <p className={styles.notice} role={notice ? 'alert' : undefined}>
        {notice}
      </p>

      <Button type="submit" className={styles.submit} disabled={!canSubmit}>
        {submitting ? '남기는 중…' : '고민 남기기'}
      </Button>
    </form>
  )
}
