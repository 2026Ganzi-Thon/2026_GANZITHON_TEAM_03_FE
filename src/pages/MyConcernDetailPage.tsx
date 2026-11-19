import { useState } from 'react'
import {
  CheeseHeader,
  ConcernReader,
  ReceivedReplies,
  useDeleteConcern,
  useMyConcernDetail,
  useSaveConcern,
} from '@/features/cheese'
import type { ConcernStatus } from '@/features/cheese'
import { BackButton, Button, Modal } from '@/shared/ui'
import styles from './MyConcernDetailPage.module.css'

export interface MyConcernDetailPageProps {
  /** 아직 받지 못했으면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  concernId: string
  /** 뒤로가기 — 치즈 보관함으로 */
  onBack?: () => void
  /** 고민을 지웠을 때 — 치즈 보관함으로 돌아간다 */
  onDeleted?: () => void
  onOpenGuide?: () => void
}

/**
 * 내 고민 상세(치즈 보관함 → "더보기"): 고민 본문 아래에 다른 사람들이 남긴 위로를 보여준다. 시안 117:2179 의 구성에서
 * 위로 작성(치즈 만들기)은 뺐다 — 내 고민에는 위로를 남길 수 없다. 탭바는 없다(고민 상세와 같음).
 * 위로 아래에 보관하기(개봉한 치즈)·보관함에서 빼기(보관한 치즈)·삭제(언제나) 버튼을 둔다.
 */
export default function MyConcernDetailPage({ woolCount, concernId, onBack, onDeleted, onOpenGuide }: MyConcernDetailPageProps) {
  const { state, retry } = useMyConcernDetail(concernId)
  const { state: saveState, save, unsave } = useSaveConcern(concernId)
  const { state: deleteState, remove, reset } = useDeleteConcern()
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
    if (await remove(concernId)) onDeleted?.()
  }

  // 위로를 받는 중에는 버튼을 그리지 않는다 — 위로가 도착하며 버튼이 아래로 밀리지 않게(처음부터 최종 자리에 나타난다)
  const showActions = state.status === 'success' && state.replies.status !== 'loading'

  return (
    <main className={styles.page}>
      {/* 임의 결정(확인 필요): 머리 제목은 "내 치즈 보관함" — 시안 117:2179 는 "우유와 치즈"(남의 고민 상세) */}
      <CheeseHeader title="내 치즈 보관함" woolCount={woolCount} onOpenGuide={onOpenGuide} />
      <div className={styles.body}>
        <BackButton className={styles.back} onClick={onBack} />

        {state.status === 'error' ? (
          <div className={styles.error} role="alert">
            <p className={styles.message}>고민을 불러오지 못했어요.</p>
            <Button variant="outline" size="sm" onClick={retry}>
              다시 시도
            </Button>
          </div>
        ) : state.status === 'gone' ? (
          // 임의 결정(확인 필요): 없거나 내 고민이 아닐 때 문구 — 시안 없음
          <div className={styles.error} role="alert">
            <p className={styles.message}>고민을 찾을 수 없어요</p>
            <Button variant="outline" size="sm" onClick={onBack}>
              보관함으로 돌아가기
            </Button>
          </div>
        ) : (
          <>
            {/* 임의 결정(확인 필요): 작성자 자리는 "나" — 시안은 "익명의 폴리"(남의 고민) */}
            <ConcernReader concern={state.status === 'success' ? state.concern : undefined} authorLabel="나" />
            {state.status === 'success' && <ReceivedReplies state={state.replies} onRetry={retry} />}
            {showActions && (
              <CheeseActions
                status={state.concern.status}
                pending={saveState.status === 'pending' ? saveState.action : null}
                notice={
                  saveState.status === 'not-opened'
                    ? '아직 열지 않은 치즈예요. 치즈를 연 뒤 보관할 수 있어요.'
                    : saveState.status === 'error'
                      ? saveState.action === 'save'
                        ? '보관하지 못했어요. 다시 시도해 주세요.'
                        : '보관함에서 빼지 못했어요. 다시 시도해 주세요.'
                      : undefined
                }
                onSave={save}
                onUnsave={unsave}
                onDelete={openConfirm}
              />
            )}
          </>
        )}
      </div>

      {/* 임의 결정(확인 필요): 삭제 확인 문구 — 시안 없음. 명세(docs/api/cheese.md 11)대로 받은 위로도 사라진다고 알린다 */}
      <Modal
        open={confirmOpen}
        onClose={closeConfirm}
        closeOnBackdrop={!deleting}
        title="이 고민을 삭제할까요?"
        footer={
          <>
            <Button variant="outline" size="sm" disabled={deleting} onClick={closeConfirm}>
              취소
            </Button>
            <Button size="sm" disabled={deleting} onClick={() => void confirmDelete()}>
              {deleting ? '삭제 중…' : '삭제'}
            </Button>
          </>
        }
      >
        <p>다른 폴리들이 남긴 위로도 함께 사라지고, 되돌릴 수 없어요.</p>
        <p className={styles.deleteError} role={deleteState.status === 'error' ? 'alert' : undefined}>
          {deleteState.status === 'error' ? '삭제하지 못했어요. 다시 시도해 주세요' : ''}
        </p>
      </Modal>
    </main>
  )
}

interface CheeseActionsProps {
  status: ConcernStatus
  /** 보관·빼기 요청 중이면 그 동작 */
  pending: 'save' | 'unsave' | null
  notice?: string
  onSave: () => void
  onUnsave: () => void
  onDelete: () => void
}

/**
 * 위로 아래 버튼 줄: 왼쪽 "삭제"(글자 버튼), 오른쪽 "보관하기"(개봉한 치즈) 또는 "보관함에서 빼기"(보관한 치즈).
 * 숙성 중·숙성 끝(여는 중)에는 삭제만. 보관과 삭제를 구분해 안내한다(명세 9: 빼도 고민과 위로는 남는다).
 * 임의 결정(확인 필요): 버튼 배치·문구 — 시안 없음
 */
function CheeseActions({ status, pending, notice, onSave, onUnsave, onDelete }: CheeseActionsProps) {
  const saved = status === 'SAVED'
  const opened = status === 'OPENED' || saved

  return (
    <section className={styles.actions} aria-label="치즈 관리">
      <div className={styles.actionRow}>
        <Button variant="outline" size="sm" className={styles.delete} disabled={pending !== null} onClick={onDelete}>
          삭제
        </Button>
        {opened && (
          <Button
            size="sm"
            variant={saved ? 'outline' : 'primary'}
            className={styles.save}
            disabled={pending !== null}
            onClick={saved ? onUnsave : onSave}
          >
            {pending === 'save' ? '보관하는 중…' : pending === 'unsave' ? '빼는 중…' : saved ? '보관함에서 빼기' : '보관하기'}
          </Button>
        )}
      </div>
      {/* 안내 자리: 늘 한 줄을 잡아 둬 실패 문구가 생겨도 위가 움직이지 않는다 */}
      <p className={notice ? styles.actionError : styles.actionHint} role={notice ? 'alert' : undefined}>
        {notice ?? (saved ? '보관함에서 빼도 고민과 위로는 남아 있어요.' : opened ? '보관한 치즈는 "보관한 치즈" 탭에 모여요.' : '')}
      </p>
    </section>
  )
}
