import { useState } from 'react'
import { CARE_CATEGORIES } from './careActions'
import type { CareActionCategory } from './careActions'
import { useCareActions, useCompleteCareAction, useTodayCareCompletions } from './careQueries'
import { Badge, Button, Header, IconButton, WoolCounter } from '@/shared/ui'
import styles from './CareCollection.module.css'

interface CareCollectionProps {
  woolCount: number | undefined
}

export function CareCollection({ woolCount }: CareCollectionProps) {
  const [category, setCategory] = useState<CareActionCategory>('move')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [startedActionIds, setStartedActionIds] = useState<Set<string>>(() => new Set())
  const actions = useCareActions(category)
  const completions = useTodayCareCompletions()
  const complete = useCompleteCareAction()

  const action = actions.data?.find((item) => item.careActionId === selectedId) ?? actions.data?.[0]
  const completion = completions.data?.find((item) => item.careActionId === action?.careActionId && item.isCompleted)
  const isDone = Boolean(completion)
  const isStarted = action ? startedActionIds.has(action.careActionId) : false

  const chooseCategory = (next: CareActionCategory) => {
    setCategory(next)
    setSelectedId(null)
  }

  return (
    <main className={styles.page}>
      <Header
        title="양털 모으기"
        actions={
          <>
            <WoolCounter count={woolCount} loading={woolCount === undefined} />
            <IconButton icon="alert-circle" aria-label="양털 모으기 안내" />
          </>
        }
      />

      <div className={styles.content}>
        <Badge className={styles.status}>{isDone ? '수집 완료' : isStarted ? '돌봄 중' : '수집 전'}</Badge>

        <section aria-labelledby="care-title" className={styles.section}>
          <h2 id="care-title">오늘의 돌봄 행동</h2>
          <p className={styles.description}>오늘의 돌봄 행동은 어떤 걸로 해볼까요?</p>

          <button
            className={styles.recommendation}
            type="button"
            onClick={() => chooseCategory('move')}
          >
            <strong>추천 돌봄 행동</strong>
            <span>본문 예시 텍스트 본문 예시 텍스트</span>
          </button>

          <div className={styles.categories} role="tablist" aria-label="돌봄 행동 분류">
            {CARE_CATEGORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={category === item.id}
                className={category === item.id ? styles.categoryActive : undefined}
                onClick={() => chooseCategory(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {actions.isPending ? (
            <p className={styles.message} role="status">돌봄 행동을 불러오는 중이에요.</p>
          ) : actions.isError ? (
            <div className={styles.loadError} role="alert">
              <p>돌봄 행동을 불러오지 못했어요.</p>
              <button type="button" onClick={() => void actions.refetch()}>다시 시도</button>
            </div>
          ) : actions.data.length === 0 ? (
            <p className={styles.message}>오늘 할 수 있는 돌봄 행동이 없어요.</p>
          ) : (
            <div className={styles.actionList} role="radiogroup" aria-label="오늘의 돌봄 행동">
              {actions.data.map((item) => {
                const selected = (selectedId ?? actions.data[0]?.careActionId) === item.careActionId
                const done = completions.data?.find((entry) => entry.careActionId === item.careActionId && entry.isCompleted)
                return (
                  <button
                    key={item.careActionId}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={selected ? styles.actionSelected : styles.action}
                    onClick={() => setSelectedId(item.careActionId)}
                  >
                    <span>{item.name}</span>
                    {done && <span className={styles.doneLabel}>완료</span>}
                  </button>
                )
              })}
            </div>
          )}

          {complete.isError && <p className={styles.error} role="alert">완료를 저장하지 못했어요. 다시 시도해주세요.</p>}
          <Button
            className={styles.submit}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!action || isDone || complete.isPending || actions.isError || completions.isError}
            onClick={() => {
              if (!action || isDone) return
              if (!isStarted) {
                setStartedActionIds((current) => new Set(current).add(action.careActionId))
                return
              }
              void complete.mutateAsync(action.careActionId).catch(() => undefined)
            }}
          >
            {isDone
              ? `돌봄 완료 : 양털 ${completion?.rewardAmount ?? 0}개`
              : complete.isPending
                ? '완료 저장 중'
                : isStarted
                  ? '돌봄 완료'
                  : '돌봄 시작'}
          </Button>
        </section>
      </div>
    </main>
  )
}
