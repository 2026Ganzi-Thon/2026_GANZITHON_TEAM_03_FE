import { Banner, Button } from '@/shared/ui'
import { HomeGreeting } from './HomeGreeting'
import type { HomeSummaryState } from './useHomeSummary'
import styles from './HomeSummaryPanel.module.css'

export interface HomeSummaryPanelProps {
  state: HomeSummaryState
  onRetry: () => void
  onOpenEmotion?: () => void
  onOpenMaturedCheese?: () => void
  /** 미리보기용: 인사말 번호 고정 */
  greetingIndex?: number
}

/** 인사말, 오늘의 감정 배너, 숙성 치즈 알림. 불러오는 중·실패 상태도 여기서 그린다. */
export function HomeSummaryPanel({
  state,
  onRetry,
  onOpenEmotion,
  onOpenMaturedCheese,
  greetingIndex,
}: HomeSummaryPanelProps) {
  if (state.status === 'loading') {
    // 임의 결정(확인 필요): 로딩 중에도 인사말·배너 틀은 바로 보여주고, 응답을 기다리는 값(이름, 배너 글자)만 회색 막대로 둔다 — Figma 에 없음
    return (
      <div className={styles.root}>
        <HomeGreeting nickname={undefined} index={greetingIndex} />
        <div className={styles.banners}>
          <Banner disabled aria-label="오늘의 감정 정보를 불러오는 중">
            <span className={styles.textSkeleton} aria-hidden="true" />
          </Banner>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    // 임의 결정(확인 필요): 불러오기 실패는 안내 문구 + "다시 시도" 버튼을 인사말 자리에 둔다 — Figma 에 없음
    return (
      <div className={styles.root}>
        <div className={styles.error} role="alert">
          <p className={styles.errorTitle}>홈 정보를 불러오지 못했어요</p>
          <p className={styles.errorDesc}>잠시 후 다시 시도해 주세요.</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  const { nickname, todayEmotion, maturedConcernCount } = state.data
  const emotionNames = todayEmotion.emotions.map((emotion) => emotion.name).join(', ')

  return (
    <div className={styles.root}>
      <HomeGreeting nickname={nickname} index={greetingIndex} />
      <div className={styles.banners}>
        <Banner onClick={onOpenEmotion}>
          {todayEmotion.recorded
            ? // 임의 결정(확인 필요): 오늘 감정을 이미 남겼으면 "오늘의 감정 기록 완료: {감정} · 다시 남기기" 로 바꾼다 — Figma 에 없음
              `오늘의 감정 기록 완료${emotionNames ? `: ${emotionNames}` : ''} · 다시 남기기`
            : '오늘의 감정 남기기'}
        </Banner>
        {maturedConcernCount >= 1 && (
          // 임의 결정(확인 필요): 숙성이 끝난 치즈가 있으면 감정 배너 아래에 금색 테두리 배너로 알린다 — Figma 에 없음
          <Banner className={styles.matured} onClick={onOpenMaturedCheese}>
            숙성이 끝난 치즈가 {maturedConcernCount}개 있어요. 열어볼까요?
          </Banner>
        )}
      </div>
    </div>
  )
}
