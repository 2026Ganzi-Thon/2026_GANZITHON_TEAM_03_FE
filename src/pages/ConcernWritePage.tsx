import { CheeseHeader, ConcernForm, useCreateConcern } from '@/features/cheese'
import { BackButton } from '@/shared/ui'
import styles from './ConcernWritePage.module.css'

export interface ConcernWritePageProps {
  /** 아직 받지 못했으면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  /** 뒤로가기 — 우유와 치즈 목록으로 */
  onBack?: () => void
  /** 다 썼을 때 — 새 고민의 상세(숙성 중)로 */
  onCreated: (concernId: string) => void
  onOpenGuide?: () => void
}

/**
 * 고민 쓰기(우유 남기기): 제목·위로 방식·내용을 쓰고 숙성을 시작한다. 탭바는 없다(양 먹이주기 작성과 같음).
 * 임의 결정(확인 필요): 시안에 없는 화면 — 우유와 치즈 머리 + 뒤로가기 + 폼. 다 쓰면 내 고민 상세로 간다(남은 숙성 시간을 바로 보여주려고).
 */
export default function ConcernWritePage({ woolCount, onBack, onCreated, onOpenGuide }: ConcernWritePageProps) {
  const { state, submit } = useCreateConcern()

  const notice =
    state.status === 'invalid'
      ? '입력한 내용을 확인해 주세요.'
      : state.status === 'error'
        ? '고민을 남기지 못했어요. 잠시 후 다시 시도해 주세요.'
        : undefined

  return (
    <main className={styles.page}>
      <CheeseHeader woolCount={woolCount} onOpenGuide={onOpenGuide} />
      <div className={styles.body}>
        <BackButton className={styles.back} onClick={onBack} />
        <h2 className={styles.title}>어떤 고민이 있나요?</h2>
        <ConcernForm
          submitting={state.status === 'submitting' || state.status === 'success'}
          notice={notice}
          onSubmit={async (values) => {
            const created = await submit(values)
            if (created) onCreated(created.concernId)
          }}
        />
      </div>
    </main>
  )
}
