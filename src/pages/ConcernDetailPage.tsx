import {
  CheeseHeader,
  ConcernReader,
  ReplyForm,
  useConcernDetail,
  useCreateReply,
} from '@/features/cheese'
import { BackButton, Button, Modal } from '@/shared/ui'
import styles from './ConcernDetailPage.module.css'

export interface ConcernDetailPageProps {
  /** 아직 받지 못했으면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  concernId: string
  onBack?: () => void
  /** 위로를 남겼거나 마감된 고민이라는 안내를 확인했을 때 — 목록으로 돌아간다 */
  onDone?: () => void
  onOpenGuide?: () => void
}

/** "고민 상세": 고민을 읽고 위로를 남긴다. 다른 사람의 위로는 보이지 않는다(API 초안). 탭바는 없다. */
export default function ConcernDetailPage({ woolCount, concernId, onBack, onDone, onOpenGuide }: ConcernDetailPageProps) {
  const { state, retry } = useConcernDetail(concernId)
  const { state: replyState, submit } = useCreateReply(concernId)

  const concern = state.status === 'success' ? state.concern : undefined
  // 목록에서 받은 뒤 마감됐거나 사라진 고민, 자기 고민이면 위로를 남길 수 없다
  const unavailable = state.status === 'gone' || (concern !== undefined && !concern.replyable)
  const closedNotice = '이미 마감됐거나 사라진 고민이에요'

  const notice =
    replyState.status === 'forbidden'
      ? '내가 쓴 고민에는 위로를 남길 수 없어요.'
      : replyState.status === 'error'
        ? '위로를 남기지 못했어요. 잠시 후 다시 시도해 주세요.'
        : unavailable
          ? closedNotice
          : undefined

  return (
    <main className={styles.page}>
      <CheeseHeader woolCount={woolCount} onOpenGuide={onOpenGuide} />
      <div className={styles.body}>
        <BackButton className={styles.back} onClick={onBack} />

        {state.status === 'error' ? (
          <div className={styles.error} role="alert">
            <p className={styles.message}>고민을 불러오지 못했어요.</p>
            <Button variant="outline" size="sm" onClick={retry}>
              다시 시도
            </Button>
          </div>
        ) : (
          <ConcernReader concern={concern} />
        )}
        {state.status === 'gone' && <p className={styles.message}>{closedNotice}</p>}

        <div className={styles.reply}>
          <ReplyForm
            disabled={state.status !== 'success' || unavailable}
            submitting={replyState.status === 'submitting'}
            notice={state.status === 'gone' ? undefined : notice}
            onSubmit={(content) => void submit(content)}
          />
        </div>
      </div>

      <Modal
        open={replyState.status === 'success' || replyState.status === 'closed'}
        onClose={() => onDone?.()}
        title={replyState.status === 'closed' ? closedNotice : '위로를 남겼어요'}
        footer={<Button size="sm" onClick={() => onDone?.()}>확인</Button>}
      >
        {replyState.status === 'closed' ? '다른 고민을 골라 보세요.' : '치즈가 숙성되고 있어요.'}
      </Modal>
    </main>
  )
}
