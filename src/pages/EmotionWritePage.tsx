import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  EmotionHeader,
  EmotionPicker,
  FeedingAnimation,
  MemoField,
  formatRecordDate,
  useCreateEmotionRecord,
  useEmotionRecord,
  useEmotions,
  useUpdateEmotionRecord,
} from '@/features/emotion'
import type { Emotion, EmotionRecord, UpdateEmotionRecordRequest } from '@/features/emotion'
import { BackButton, Button } from '@/shared/ui'
import styles from './EmotionWritePage.module.css'

export interface EmotionWritePageProps {
  /** 아직 받지 못했으면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  /** 있으면 그 기록의 수정 화면이 된다(먹이 주기 연출 없음) */
  recordId?: string
  onBack?: () => void
  /** 저장하고 먹이 주기 연출까지 끝났을 때(작성) */
  onFed?: () => void
  /** 고친 내용을 저장했을 때(수정) — 기록 상세로 돌아간다 */
  onSaved?: () => void
  /** 고치려는 기록이 없을 때(수정, 404) — 목록으로 돌아간다 */
  onNotFound?: () => void
  onOpenGuide?: () => void
}

/**
 * "오늘의 먹이주기": 감정(복수 선택)과 메모를 입력하고 먹이를 준다.
 * `recordId` 가 있으면 같은 화면으로 그 기록을 고친다(`PATCH /emotion-records/{id}`, 바뀐 필드만 보낸다).
 * 임의 결정(확인 필요): 수정 화면은 시안이 없어 작성 화면을 그대로 쓰고, 뒤로가기 아래에 "○월 ○일 ○요일 기록 수정" 한 줄과 "수정 완료" 버튼만 바꿨다.
 */
export default function EmotionWritePage(props: EmotionWritePageProps) {
  return props.recordId ? <EditEmotion {...props} recordId={props.recordId} /> : <CreateEmotion {...props} />
}

function WriteLayout({ woolCount, onBack, onOpenGuide, children }: EmotionWritePageProps & { children: ReactNode }) {
  return (
    <main className={styles.page}>
      <EmotionHeader woolCount={woolCount} onOpenGuide={onOpenGuide} />
      <div className={styles.body}>
        <BackButton className={styles.back} onClick={onBack} />
        {children}
      </div>
    </main>
  )
}

interface EmotionFormProps {
  /** 수정 화면의 날짜 줄. undefined 면 줄이 없고(작성), null 이면 같은 크기의 막대(기록을 받는 중) */
  editingDate?: string | null
  emotions: Emotion[]
  emotionsStatus: 'loading' | 'error' | 'success'
  onRetryEmotions: () => void
  selectedIds: string[]
  onChangeSelected: (ids: string[]) => void
  memo: string
  onChangeMemo: (memo: string) => void
  notice?: string
  submitLabel: string
  canSubmit: boolean
  onSubmit: () => void
}

/** 감정 칩·지푸라기·버튼. 작성과 수정이 같은 모양을 쓴다. */
function EmotionForm({
  editingDate,
  emotions,
  emotionsStatus,
  onRetryEmotions,
  selectedIds,
  onChangeSelected,
  memo,
  onChangeMemo,
  notice,
  submitLabel,
  canSubmit,
  onSubmit,
}: EmotionFormProps) {
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) onSubmit()
      }}
    >
      {editingDate !== undefined &&
        (editingDate === null ? (
          <span className={styles.editingSkeleton} aria-hidden="true" />
        ) : (
          <p className={styles.editing}>{formatRecordDate(editingDate)} 기록 수정</p>
        ))}

      {emotionsStatus === 'error' && (
        <div className={styles.error} role="alert">
          <p className={styles.message}>감정을 불러오지 못했어요.</p>
          <Button variant="outline" size="sm" onClick={onRetryEmotions}>
            다시 시도
          </Button>
        </div>
      )}
      {emotionsStatus !== 'error' && (
        <EmotionPicker
          emotions={emotions}
          selectedIds={selectedIds}
          onChange={onChangeSelected}
          loading={emotionsStatus === 'loading'}
        />
      )}

      <MemoField value={memo} onChange={onChangeMemo} />

      <Button type="submit" className={styles.submit} disabled={!canSubmit}>
        {submitLabel}
      </Button>

      {/* 안내는 버튼 아래 — 떠도 위쪽(입력·버튼)이 밀리지 않는다 */}
      {notice && (
        <p className={styles.notice} role="alert">
          {notice}
        </p>
      )}
    </form>
  )
}

function CreateEmotion({ onFed, ...layout }: EmotionWritePageProps) {
  const { state: emotionsState, retry } = useEmotions()
  const { state: createState, submit } = useCreateEmotionRecord()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [memo, setMemo] = useState('')

  // 감정이 하나도 없으면(불러오는 중·실패·빈 목록·미선택) 먹이를 줄 수 없다
  const canSubmit =
    selectedIds.length > 0 && createState.status !== 'submitting' && createState.status !== 'already-exists'

  if (createState.status === 'success') {
    return <FeedingAnimation onDone={() => onFed?.()} />
  }

  return (
    <WriteLayout {...layout}>
      <EmotionForm
        emotions={emotionsState.status === 'success' ? emotionsState.emotions : []}
        emotionsStatus={emotionsState.status}
        onRetryEmotions={retry}
        selectedIds={selectedIds}
        onChangeSelected={setSelectedIds}
        memo={memo}
        onChangeMemo={setMemo}
        notice={
          createState.status === 'already-exists'
            ? '오늘 먹이를 줬어요. 내일 다시 만나요!'
            : createState.status === 'error'
              ? '저장하지 못했어요. 잠시 후 다시 시도해 주세요.'
              : undefined
        }
        submitLabel="먹이주기"
        canSubmit={canSubmit}
        onSubmit={() => void submit({ emotionIds: selectedIds, memo })}
      />
    </WriteLayout>
  )
}

function EditEmotion({ recordId, onSaved, onNotFound, ...layout }: EmotionWritePageProps & { recordId: string }) {
  // 상세에서 들어오면 상세·목록 캐시가 있어 바로 채워진다
  const { state, retry } = useEmotionRecord(recordId)

  if (state.status === 'success') {
    // 다른 기록으로 바뀌면 입력을 새로 채운다
    return (
      <WriteLayout {...layout}>
        <EditForm key={state.record.recordId} record={state.record} onSaved={onSaved} onNotFound={onNotFound} />
      </WriteLayout>
    )
  }

  return (
    <WriteLayout {...layout}>
      {state.status === 'loading' && (
        // 받는 중에도 같은 자리·크기로 그려 두어 채워질 때 흔들리지 않는다
        <EmotionForm
          editingDate={null}
          emotions={[]}
          emotionsStatus="loading"
          onRetryEmotions={() => {}}
          selectedIds={[]}
          onChangeSelected={() => {}}
          memo=""
          onChangeMemo={() => {}}
          submitLabel="수정 완료"
          canSubmit={false}
          onSubmit={() => {}}
        />
      )}
      {state.status === 'error' && (
        <div className={styles.error} role="alert">
          <p className={styles.message}>기록을 불러오지 못했어요.</p>
          <Button variant="outline" size="sm" onClick={retry}>
            다시 시도
          </Button>
        </div>
      )}
      {state.status === 'not-found' && (
        <div className={styles.error} role="alert">
          <p className={styles.message}>기록을 찾을 수 없어요.</p>
          <Button variant="outline" size="sm" onClick={onNotFound}>
            목록으로 돌아가기
          </Button>
        </div>
      )}
    </WriteLayout>
  )
}

function sameIds(a: string[], b: string[]) {
  return a.length === b.length && a.every((id) => b.includes(id))
}

/** 활성 감정 + 이 기록에 원래 있던 비활성 감정(서버가 남겨 두는 것은 허용). 표시 순서대로 */
function editableEmotions(active: Emotion[], record: EmotionRecord): Emotion[] {
  const ids = new Set(active.map((emotion) => emotion.emotionId))
  const kept = record.emotions.filter((emotion) => !ids.has(emotion.emotionId))
  return [...active, ...kept].sort((a, b) => a.displayOrder - b.displayOrder || Number(a.emotionId) - Number(b.emotionId))
}

function EditForm({
  record,
  onSaved,
  onNotFound,
}: {
  record: EmotionRecord
  onSaved?: () => void
  onNotFound?: () => void
}) {
  const { state: emotionsState, retry } = useEmotions()
  const { state: updateState, submit } = useUpdateEmotionRecord(record.recordId)
  const initialIds = record.emotions.map((emotion) => emotion.emotionId)
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds)
  const [memo, setMemo] = useState(record.memo ?? '')

  const emotions = emotionsState.status === 'success' ? editableEmotions(emotionsState.emotions, record) : []
  // 감정 목록을 다시 받아 사라진 감정(그새 비활성이 된 새 선택)은 선택에서도 뺀다
  const chosenIds =
    emotionsState.status === 'success'
      ? selectedIds.filter((id) => emotions.some((emotion) => emotion.emotionId === id))
      : selectedIds
  const nextMemo = memo.trim() === '' ? null : memo
  const emotionsChanged = !sameIds(chosenIds, initialIds)
  const memoChanged = nextMemo !== record.memo
  // 바뀐 것이 없으면 보내지 않는다(서버는 빈 수정을 400 COMMON_EMPTY_UPDATE 로 거절)
  const canSubmit =
    chosenIds.length > 0 &&
    (emotionsChanged || memoChanged) &&
    updateState.status !== 'submitting' &&
    updateState.status !== 'not-found'

  const save = async () => {
    const body: UpdateEmotionRecordRequest = {}
    if (emotionsChanged) body.emotionIds = chosenIds
    if (memoChanged) body.memo = nextMemo
    if (await submit(body)) onSaved?.()
  }

  // 임의 결정(확인 필요): 실패 문구 — 시안 없음, 작성 화면 톤
  const notice =
    updateState.status === 'not-found'
      ? '이미 삭제된 기록이에요.'
      : updateState.status === 'invalid-selection'
        ? '지금은 고를 수 없는 감정이 있어요. 다시 골라 주세요.'
        : updateState.status === 'error'
          ? '저장하지 못했어요. 잠시 후 다시 시도해 주세요.'
          : chosenIds.length === 0 && emotionsState.status === 'success'
            ? '감정을 하나 이상 골라 주세요.'
            : undefined

  return (
    <>
      <EmotionForm
        editingDate={record.recordDate}
        emotions={emotions}
        emotionsStatus={emotionsState.status}
        onRetryEmotions={retry}
        selectedIds={chosenIds}
        onChangeSelected={setSelectedIds}
        memo={memo}
        onChangeMemo={setMemo}
        notice={notice}
        submitLabel="수정 완료"
        canSubmit={canSubmit}
        onSubmit={() => void save()}
      />
      {updateState.status === 'not-found' && (
        <Button variant="outline" size="sm" className={styles.notFoundBack} onClick={onNotFound}>
          목록으로 돌아가기
        </Button>
      )}
    </>
  )
}
