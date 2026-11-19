import { useState } from 'react'
import { hasErrorCode, isApiError } from '@/shared/api'
import { Badge, Button, Header, IconButton, WoolCounter } from '@/shared/ui'
import {
  CARE_ACTION_INACTIVE,
  CARE_ACTION_NOT_FOUND,
  CARE_ALREADY_CANCELLED,
  CARE_ALREADY_COMPLETED,
  CARE_CANCEL_DATE_EXPIRED,
  CARE_COMPLETION_CYCLE_CHANGED,
  CARE_COMPLETION_NOT_FOUND,
  WOOL_BALANCE_INSUFFICIENT,
  WOOL_BALANCE_LIMIT_EXCEEDED,
} from './careApi'
import { SKELETON_CATEGORIES, categoryOf, groupCareActions } from './careCategories'
import type { CareCategoryId } from './careCategories'
import { useCancelCareCompletion, useCareActions, useCompleteCareAction, useTodayCareCompletions } from './careQueries'
import type { CareAction, CareCompletion } from './types'
import styles from './CareCollection.module.css'

interface CareCollectionProps {
  woolCount: number | undefined
  /** "내 양털" 알약을 눌렀을 때 — 양털 내역으로 */
  onOpenWoolHistory?: () => void
  /** 오른쪽 위 `!` — 사용법 안내 열기 */
  onOpenGuide?: () => void
  /** 사용법 안내 중 — 실제 목록 대신 이 예시로 그린다(화살표가 늘 같은 자리를 가리키게) */
  guide?: { actions: CareAction[]; recommendedId: string }
}

/** 시안 한 탭의 행 수. 목록 자리를 이만큼 늘 잡아 두어 로딩·탭 전환에 버튼이 오르내리지 않는다 */
const ROWS_PER_TAB = 4

function completeErrorMessage(error: unknown) {
  if (hasErrorCode(error, CARE_ALREADY_COMPLETED)) return '오늘 이미 완료한 돌봄이에요.'
  if (hasErrorCode(error, CARE_ACTION_INACTIVE) || hasErrorCode(error, CARE_ACTION_NOT_FOUND))
    return '지금은 할 수 없는 돌봄이에요. 다른 돌봄을 골라 주세요.'
  if (hasErrorCode(error, WOOL_BALANCE_LIMIT_EXCEEDED)) return '양털을 더 모을 수 없어요.'
  if (isApiError(error) && error.status === 0) return `${error.message}`
  return '완료를 저장하지 못했어요. 다시 시도해 주세요.'
}

function cancelErrorMessage(error: unknown) {
  if (hasErrorCode(error, WOOL_BALANCE_INSUFFICIENT)) return '받은 양털을 이미 써서 취소할 수 없어요.'
  if (hasErrorCode(error, CARE_CANCEL_DATE_EXPIRED)) return '오늘 완료한 돌봄만 취소할 수 있어요.'
  if (
    hasErrorCode(error, CARE_ALREADY_CANCELLED) ||
    hasErrorCode(error, CARE_COMPLETION_CYCLE_CHANGED) ||
    hasErrorCode(error, CARE_COMPLETION_NOT_FOUND)
  )
    return '완료 상태가 바뀌었어요. 다시 확인해 주세요.'
  if (isApiError(error) && error.status === 0) return `${error.message}`
  return '취소하지 못했어요. 다시 시도해 주세요.'
}

/** 날마다 바뀌는 추천: 오늘 아직 안 한 행동 중 날짜로 하나 고른다(같은 날에는 같은 추천) */
function pickRecommendation(actions: CareAction[], doneIds: Set<string>, actionDate: string) {
  const candidates = actions.filter((action) => !doneIds.has(action.careActionId))
  if (candidates.length === 0) return null
  const day = Math.floor(Date.parse(actionDate) / 86_400_000) || 0
  return candidates[day % candidates.length]
}

export function CareCollection({ woolCount, onOpenWoolHistory, onOpenGuide, guide }: CareCollectionProps) {
  const actionsQuery = useCareActions()
  const todayQuery = useTodayCareCompletions()
  const complete = useCompleteCareAction()
  const cancel = useCancelCareCompletion()

  /** 사용자가 고른 탭(null 이면 추천 행동의 탭) */
  const [userCategory, setPickedCategory] = useState<CareCategoryId | null>(null)
  /** 사용자가 고른 행동(null 이면 지금 탭의 첫 미완료 행동) */
  const [userPickedId, setPickedId] = useState<string | null>(null)
  /** 돌봄을 시작한 행동 — 시안(290:491)처럼 그 행동 하나만 남긴다 */
  const [userStartedId, setStartedId] = useState<string | null>(null)

  const actions = guide ? guide.actions : actionsQuery.data
  const today = guide ? { actionDate: '2026-01-01', items: [] as CareCompletion[] } : todayQuery.data
  // 안내 중에는 사용자가 고른 탭·행동·시작 상태를 쓰지 않는다
  const pickedCategory = guide ? null : userCategory
  const pickedId = guide ? null : userPickedId
  const startedId = guide ? null : userStartedId
  const loading = actions === undefined || today === undefined
  const loadFailed = !loading ? false : actionsQuery.isError || todayQuery.isError

  const completionByAction = new Map<string, CareCompletion>()
  for (const item of today?.items ?? []) if (item.isCompleted) completionByAction.set(item.careActionId, item)
  const doneIds = new Set(completionByAction.keys())

  const groups = groupCareActions(actions ?? [])
  const recommended = guide
    ? (guide.actions.find((action) => action.careActionId === guide.recommendedId) ?? null)
    : actions && today
      ? pickRecommendation(actions, doneIds, today.actionDate)
      : null
  const categories = loading ? SKELETON_CATEGORIES : groups.categories
  const autoCategory: CareCategoryId =
    (recommended && categoryOf(recommended)) ??
    groups.categories.find((item) => groups.byCategory(item.id).length > 0)?.id ??
    categories[0].id
  const category: CareCategoryId =
    pickedCategory && categories.some((item) => item.id === pickedCategory) ? pickedCategory : autoCategory
  const visible = groups.byCategory(category)

  const started = actions?.find((action) => action.careActionId === startedId) ?? null
  const selected =
    started ??
    visible.find((action) => action.careActionId === pickedId) ??
    (recommended && visible.includes(recommended) ? recommended : null) ??
    visible.find((action) => !doneIds.has(action.careActionId)) ??
    visible[0] ??
    null
  const completion = selected ? (completionByAction.get(selected.careActionId) ?? null) : null
  const focused = started !== null

  const resetFeedback = () => {
    complete.reset()
    cancel.reset()
  }

  const chooseCategory = (next: CareCategoryId) => {
    setPickedCategory(next)
    setPickedId(null)
    resetFeedback()
  }

  const chooseAction = (action: CareAction) => {
    setPickedCategory(categoryOf(action))
    setPickedId(action.careActionId)
    resetFeedback()
  }

  const backToList = () => {
    setStartedId(null)
    resetFeedback()
  }

  const onMain = () => {
    if (!selected || completion || complete.isPending) return
    if (!focused) {
      setPickedId(selected.careActionId)
      setStartedId(selected.careActionId)
      resetFeedback()
      return
    }
    complete.mutate(selected.careActionId)
  }

  const onCancel = () => {
    if (!completion?.earningTransactionId || cancel.isPending) return
    complete.reset()
    cancel.mutate({ completionId: completion.completionId, earningTransactionId: completion.earningTransactionId })
  }

  const status = completion ? '수집 완료' : focused ? '돌봄 중' : '수집 전'
  const mainLabel = completion
    ? `돌봄 완료 : 양털 ${completion.rewardAmount}개`
    : complete.isPending
      ? '완료 저장 중'
      : focused
        ? '돌봄 완료'
        : '돌봄 시작'
  const mainDisabled = loading || !selected || complete.isPending || cancel.isPending
  const errorMessage = complete.isError
    ? completeErrorMessage(complete.error)
    : cancel.isError
      ? cancelErrorMessage(cancel.error)
      : null

  const retryLoad = () => {
    if (actionsQuery.isError) void actionsQuery.refetch()
    if (todayQuery.isError) void todayQuery.refetch()
  }

  return (
    <main className={styles.page}>
      <Header
        title="양털 모으기"
        actions={
          <>
            {/* 임의 결정(확인 필요): 시안에 내역 화면·진입점이 없어 이 화면의 "내 양털" 알약을 누르면 양털 내역으로 간다 */}
            <button type="button" className={styles.woolButton} aria-label="양털 내역 보기" onClick={onOpenWoolHistory}>
              <WoolCounter count={woolCount} loading={woolCount === undefined} />
            </button>
            <IconButton icon="alert-circle" aria-label="양털 모으기 안내" onClick={onOpenGuide} />
          </>
        }
      />

      <div className={styles.content}>
        {loading ? (
          <span className={styles.badgeSkeleton} aria-hidden="true" />
        ) : (
          <Badge className={styles.status}>{status}</Badge>
        )}

        <section aria-labelledby="care-title" className={styles.section} aria-busy={loading || undefined}>
          <h2 id="care-title">오늘의 돌봄 행동</h2>
          <p className={styles.description}>오늘의 돌봄 행동은 어떤 걸로 해볼까요?</p>

          <button
            className={styles.recommendation}
            data-guide="recommend"
            type="button"
            disabled={!recommended || focused}
            onClick={() => recommended && chooseAction(recommended)}
          >
            <strong>추천 돌봄 행동</strong>
            <span className={styles.recommendationText}>
              {loadFailed ? (
                '불러오지 못했어요'
              ) : loading ? (
                <span className={styles.barInline} aria-hidden="true" />
              ) : (
                (recommended?.name ?? (actions.length > 0 ? '오늘의 돌봄을 모두 마쳤어요' : '준비 중이에요'))
              )}
            </span>
          </button>

          {focused && started ? (
            <div className={styles.focusRow} aria-live="polite">
              <span>{started.name}</span>
            </div>
          ) : (
            <div data-guide="categories">
              <div className={styles.categories} role="tablist" aria-label="돌봄 행동 분류">
                  {categories.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={!loading && category === item.id}
                      disabled={loading}
                      className={!loading && category === item.id ? styles.categoryActive : undefined}
                      onClick={() => chooseCategory(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
              </div>

              <div className={styles.listBox}>
                {loading && !loadFailed ? (
                  <div className={styles.actionList} aria-hidden="true">
                    {Array.from({ length: ROWS_PER_TAB }, (_, index) => (
                      <span key={index} className={styles.rowSkeleton}>
                        <span className={styles.bar} style={{ width: `${[38, 46, 34, 54][index]}%` }} />
                      </span>
                    ))}
                  </div>
                ) : loadFailed ? (
                  <div className={styles.boxMessage} role="alert">
                    <p>돌봄 행동을 불러오지 못했어요.</p>
                    <button type="button" className={styles.textButton} onClick={retryLoad}>
                      다시 시도
                    </button>
                  </div>
                ) : visible.length === 0 ? (
                  <div className={styles.boxMessage}>
                    <p>
                      {actions && actions.length === 0
                        ? '아직 준비된 돌봄 행동이 없어요.\n조금 뒤에 다시 와 주세요.'
                        : '이 분류에는 아직 돌봄 행동이 없어요.'}
                    </p>
                  </div>
                ) : (
                  <div className={styles.actionList} role="radiogroup" aria-label="오늘의 돌봄 행동">
                    {visible.map((item) => {
                      const isSelected = selected?.careActionId === item.careActionId
                      return (
                        <button
                          key={item.careActionId}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={isSelected ? styles.actionSelected : styles.action}
                          onClick={() => chooseAction(item)}
                        >
                          <span>{item.name}</span>
                          {doneIds.has(item.careActionId) && <span className={styles.doneLabel}>완료</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            data-guide="start"
            className={focused ? styles.submitFocused : styles.submit}
            variant="primary"
            size="lg"
            fullWidth
            disabled={mainDisabled && !completion}
            aria-disabled={completion ? true : undefined}
            onClick={onMain}
          >
            {mainLabel}
          </Button>

          {/* 안내·보조 동작 자리. 버튼 아래라 무엇이 떠도 위쪽 자리는 그대로다 */}
          <div className={styles.feedback}>
            {errorMessage && (
              <p className={styles.error} role="alert">
                {errorMessage}
              </p>
            )}
            {!loading && (completion || focused) && (
              <div className={styles.links}>
                {focused && (
                  <button type="button" className={styles.textButton} onClick={backToList}>
                    {completion ? '다른 돌봄 하기' : '다른 행동 고르기'}
                  </button>
                )}
                {completion?.earningTransactionId && (
                  <button type="button" className={styles.textButton} onClick={onCancel} disabled={cancel.isPending}>
                    {cancel.isPending ? '취소하는 중' : '완료 취소'}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
