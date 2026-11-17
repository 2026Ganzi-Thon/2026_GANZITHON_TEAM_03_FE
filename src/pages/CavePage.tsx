import { useEffect, useState } from 'react'
import {
  CaveHeader,
  CaveScene,
  DEFAULT_REST_DURATION,
  DurationPicker,
  REST_DURATION_OPTIONS,
  useCurrentRestSession,
  useStartRestSession,
  waitForDoor,
} from '@/features/rest'
import type { CaveDecoration } from '@/features/rest'
import { useIslandItems } from '@/features/island'
import type { IslandItem } from '@/features/island'
import { Banner, Button } from '@/shared/ui'
import styles from './CavePage.module.css'

export interface CavePageProps {
  /** 보유한 양털 개수. 아직 받지 못했으면 undefined(숫자 자리에 막대) */
  woolCount: number | undefined
  /** 들어와 보니 이미 쉬는 중일 때 — 진행 중 화면으로 */
  onRunning?: () => void
  /** 휴식을 시작하고 문이 다 닫혔을 때 — 진행 중 화면으로 */
  onStarted?: () => void
  onOpenGuide?: () => void
  /** 안내 배너. 이동할 곳이 아직 없다 */
  onOpenBanner?: () => void
}

/** 섬 꾸미기에서 산 가구를 동굴 섬에 놓을 모양으로 — 두 기능을 아는 페이지가 잇는다(규칙 2). 받는 중·실패면 빈 섬 */
function toDecorations(items: IslandItem[]): CaveDecoration[] {
  return items
    .filter((item) => item.owned && item.placedImageUrl !== null)
    .map((item) => ({
      id: item.itemId,
      name: item.name,
      src: item.placedImageUrl ?? '',
      order: item.placedOrder,
      floatAt: item.floatAt,
    }))
}

/**
 * "동굴 문 닫기" 시작 전(시안 37:26): 열린 동굴 섬, 휴식 시간 알약 3개, "동굴 문 닫기" 버튼. 탭바 있는 화면.
 * 들어오면 현재 휴식 상태를 조회해 쉬는 중이면 진행 중 화면으로 보낸다. 시작하면 문이 닫히는 전환 뒤 진행 중 화면으로 간다.
 */
export default function CavePage({ woolCount, onRunning, onStarted, onOpenGuide, onOpenBanner }: CavePageProps) {
  const { state, retry } = useCurrentRestSession()
  const { state: startState, start } = useStartRestSession()
  const { state: islandState } = useIslandItems()
  const decorations = islandState.status === 'success' ? toDecorations(islandState.items) : []
  const [duration, setDuration] = useState(DEFAULT_REST_DURATION)
  /** 시작을 누른 뒤 진행 중 화면으로 갈 때까지. 그동안은 "이미 쉬는 중" 이동을 하지 않는다(문 닫히는 전환을 보여야 해서) */
  const [closing, setClosing] = useState(false)
  const [doorClosed, setDoorClosed] = useState(false)

  const running = state.status === 'success' && state.session?.status === 'RUNNING'

  useEffect(() => {
    if (running && !closing) onRunning?.()
  }, [running, closing, onRunning])

  const handleStart = async () => {
    setClosing(true)
    if (await start(duration)) {
      setDoorClosed(true)
      await waitForDoor()
      onStarted?.()
    } else {
      // 이미 쉬는 중(409)이면 다시 받은 현재 상태로 위 effect 가 진행 중 화면으로 보낸다
      setClosing(false)
    }
  }

  const busy = closing || running || state.status !== 'success'

  return (
    <main className={styles.page}>
      <CaveHeader woolCount={woolCount} onOpenGuide={onOpenGuide} />
      <div className={styles.body}>
        <Banner className={styles.banner} onClick={onOpenBanner}>동굴 문을 닫고 나의 시간에 집중해보세요</Banner>

        <div className={styles.scene}>
          <CaveScene closed={doorClosed || running} decorations={decorations} />
        </div>

        <div className={styles.picker}>
          <DurationPicker options={REST_DURATION_OPTIONS} value={duration} onChange={setDuration} disabled={closing} />
        </div>

        <div className={styles.actions}>
          {state.status === 'error' ? (
            <p className={styles.notice} role="alert">
              휴식 상태를 불러오지 못했어요.
              <Button variant="ghost" size="sm" onClick={retry}>
                다시 시도
              </Button>
            </p>
          ) : startState.status === 'error' ? (
            <p className={styles.notice} role="alert">
              동굴 문을 닫지 못했어요. 잠시 후 다시 시도해 주세요.
            </p>
          ) : null}
          <Button size="lg" fullWidth disabled={busy} onClick={() => void handleStart()}>
            동굴 문 닫기
          </Button>
        </div>
      </div>
    </main>
  )
}
