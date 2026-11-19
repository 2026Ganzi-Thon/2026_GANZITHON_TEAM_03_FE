import { useState } from 'react'
import { EmotionHeader, formatRecordDate, useDeleteEmotionRecord, useEmotionRecord } from '@/features/emotion'
import type { EmotionRecord } from '@/features/emotion'
import { formatRelativeDate } from '@/shared/lib/formatRelativeDate'
import { Badge, BackButton, Button, Modal } from '@/shared/ui'
import styles from './EmotionRecordPage.module.css'

export interface EmotionRecordPageProps {
  /** 아직 받지 못했으면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  recordId: string
  onBack?: () => void
  /** 기록을 지웠을 때 — 목록으로 돌아간다 */
  onDeleted?: () => void
  /** "수정" — 같은 기록의 수정 화면(작성 화면 재사용)으로 */
  onEdit?: () => void
  onOpenGuide?: () => void
}

/**
 * 감정 기록 상세: 날짜, 그날의 감정, 지푸라기(메모)를 읽고 고치거나 삭제한다. 탭바는 없다.
 * 임의 결정(확인 필요): 시안에 없는 화면이라 작성 화면·고민 상세의 글자 크기·간격·공통 컴포넌트만으로 구성했다.
 * 임의 결정(확인 필요): "수정"·"삭제"를 지푸라기 아래 오른쪽에 나란히 둔다 — 수정은 작성 화면을 수정 모드로 연다.
 */
export default function EmotionRecordPage({ woolCount, recordId, onBack, onDeleted, onEdit, onOpenGuide }: EmotionRecordPageProps) {
  const { state, retry } = useEmotionRecord(recordId)
  const { state: deleteState, remove, reset } = useDeleteEmotionRecord()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const deleting = deleteState.status === 'deleting'

  const openConfirm = () => {
    reset()
    setConfirmOpen(true)
  }
  const closeConfirm = () => {
    // 지우는 중에는 닫지 않는다(결과를 기다린다)
    if (!deleting) setConfirmOpen(false)
  }
  const confirmDelete = async () => {
    if (await remove(recordId)) onDeleted?.()
  }

  return (
    <main className={styles.page}>
      <EmotionHeader woolCount={woolCount} onOpenGuide={onOpenGuide} />
      <div className={styles.body}>
        <BackButton className={styles.back} onClick={onBack} />

        {state.status === 'loading' && <RecordSkeleton />}

        {state.status === 'error' && (
          <div className={styles.error} role="alert">
            <p className={styles.message}>기록을 불러오지 못했어요</p>
            <Button variant="outline" size="sm" onClick={retry}>
              다시 시도
            </Button>
          </div>
        )}

        {state.status === 'not-found' && (
          <div className={styles.error} role="alert">
            <p className={styles.message}>기록을 찾을 수 없어요</p>
            <Button variant="outline" size="sm" onClick={onBack}>
              목록으로 돌아가기
            </Button>
          </div>
        )}

        {state.status === 'success' && (
          <>
            <RecordContent record={state.record} />
            <div className={styles.actions}>
              <Button variant="outline" size="md" onClick={onEdit}>
                수정
              </Button>
              <Button variant="outline" size="md" onClick={openConfirm}>
                삭제
              </Button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={closeConfirm}
        closeOnBackdrop={!deleting}
        title="이 기록을 삭제할까요?"
        footer={
          <>
            <Button variant="outline" size="sm" disabled={deleting} onClick={closeConfirm}>
              취소
            </Button>
            <Button size="sm" disabled={deleting} onClick={() => void confirmDelete()}>
              삭제
            </Button>
          </>
        }
      >
        <p>삭제하면 되돌릴 수 없어요.</p>
        {deleteState.status === 'error' && (
          <p className={styles.deleteError} role="alert">
            삭제하지 못했어요. 다시 시도해 주세요
          </p>
        )}
      </Modal>
    </main>
  )
}

function RecordContent({ record }: { record: EmotionRecord }) {
  const emotions = [...record.emotions].sort((a, b) => a.displayOrder - b.displayOrder)
  const edited = record.updatedAt !== record.createdAt

  return (
    <article className={styles.record}>
      <h2 className={styles.title}>{formatRecordDate(record.recordDate)}</h2>
      <p className={styles.meta}>
        <time dateTime={record.recordDate}>{formatRelativeDate(record.recordDate)}</time>
        {edited && (
          <>
            <span className={styles.dot} aria-hidden="true" />
            <span>수정됨</span>
          </>
        )}
      </p>

      <section className={styles.section} aria-labelledby="record-emotions-label">
        <h3 id="record-emotions-label" className={styles.emotionLabel}>
          그날의 감정
        </h3>
        {/* 비활성(active: false) 감정도 그날 고른 감정이라 그대로 보여준다 */}
        <ul className={styles.badges}>
          {emotions.map((emotion) => (
            <li key={emotion.emotionId}>
              <Badge tone="primary">{emotion.name}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="record-memo-label">
        <h3 id="record-memo-label" className={styles.memoLabel}>
          지푸라기
        </h3>
        {record.memo ? (
          <p className={styles.memo}>{record.memo}</p>
        ) : (
          <p className={`${styles.memo} ${styles.memoEmpty}`}>남긴 지푸라기가 없어요</p>
        )}
      </section>
    </article>
  )
}

/** 제목·메타·본문 자리의 회색 막대. 고민 상세(ConcernReader) 스켈레톤과 같은 크기. */
function RecordSkeleton() {
  return (
    <div className={styles.record} role="status" aria-label="기록을 불러오는 중">
      <span className={styles.skeletonTitle} />
      <span className={styles.skeletonMeta} />
      <div className={styles.skeletonBody}>
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.bar} />
        <span className={styles.barShort} />
      </div>
    </div>
  )
}
