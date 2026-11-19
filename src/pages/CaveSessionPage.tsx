import { useEffect, useRef, useState } from 'react'
import {
  AfterMemoModal,
  CaveHeader,
  CaveOpenModal,
  CaveScene,
  RestTimer,
  useCancelRestSession,
  useCurrentRestSession,
  useFlatSensor,
  useRestCountdown,
  useSaveAfterMemo,
  useWakeLock,
  waitForDoor,
} from '@/features/rest'
import type { CaveDecoration, RestSession } from '@/features/rest'
import { useIslandItems } from '@/features/island'
import type { IslandItem } from '@/features/island'
import { Banner, Button } from '@/shared/ui'
import styles from './CaveSessionPage.module.css'

export interface CaveSessionPageProps {
  /** 휴식이 끝나(시간 다 됨·중도 종료) 문이 열리고 한 줄 메모를 남기거나 건너뛰었을 때 — 시작 전 화면으로 */
  onEnded?: () => void
  /** 진행 중 휴식 없이 들어왔을 때 — 시작 전 화면으로 */
  onNoSession?: () => void
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
 * "동굴 문 닫기" 진행 중(시안 63:1283): 돌로 닫힌 동굴 섬, 남은 시간, "동굴 문 열기". 탭바 없음.
 * 남은 시간은 서버 시각과의 차이로 1초마다 화면에서 계산하고, 탭이 다시 보이면 현재 상태를 다시 받는다.
 * 시간이 다 되거나 확인 뒤 중도 종료하면 문이 열리고, 쉬고 난 기분을 한 줄로 남기는 팝업(건너뛰기 가능, `PATCH …/after-memo`)을 거쳐
 * 시작 전 화면으로 돌아간다.
 * 임의 결정(확인 필요): 메모 팝업은 이 화면에서 진행 중인 휴식을 본 경우에만 띄운다 — 앱을 새로 열었을 때 이미 끝나 있었으면
 * 지금처럼 바로 시작 전 화면으로 보낸다(그때 물어볼 자리·시안이 없음).
 * 임의 결정(확인 필요): 시안의 "branding ment" 자리 글자는 문구가 없어 넣지 않는다.
 * 임의 결정(확인 필요): 시간이 다 되면 따로 완료 화면 없이 문이 열리고 메모 팝업 뒤 시작 전 화면으로 돌아간다(시안 없음).
 * 임의 결정(확인 필요): 시안 83:293(열린 동굴 + 남은 시간 + "동굴 문 닫기")은 이 화면의 이전 안으로 보고 따로 만들지 않는다.
 * 임의 결정(확인 필요): 진행 중 휴식 없이 들어오면 안내 없이 시작 전 화면으로 보낸다.
 */
export default function CaveSessionPage({ onEnded, onNoSession, onOpenGuide, onOpenBanner }: CaveSessionPageProps) {
  const { state, retry } = useCurrentRestSession()
  const { state: cancelState, cancel, reset } = useCancelRestSession()
  const { state: memoState, save: saveMemo } = useSaveAfterMemo()
  /** 문이 열린 뒤 메모를 물어볼 끝난 휴식 */
  const [memoSession, setMemoSession] = useState<RestSession | null>(null)
  const [memoOpen, setMemoOpen] = useState(false)
  const { state: islandState } = useIslandItems()
  const decorations = islandState.status === 'success' ? toDecorations(islandState.items) : []
  const [confirming, setConfirming] = useState(false)
  /** 확인 팝업이 휴대폰을 들어서 저절로 뜬 것인지 — 그렇다면 다시 눕히면 닫는다 */
  const [lifted, setLifted] = useState(false)
  /** 이 화면에서 진행 중인 휴식을 본 적이 있는지 — 끝났을 때 문을 열고 갈지, 바로 보낼지 */
  const sawRunning = useRef(false)
  const leaving = useRef(false)

  const session = state.status === 'success' ? state.session : null
  const running = session?.status === 'RUNNING'
  const remaining = useRestCountdown(session, state.status === 'success' ? state.serverOffsetMs : 0)
  const ended = state.status === 'success' && !running

  useEffect(() => {
    if (running) sawRunning.current = true
  }, [running])

  // 끝났으면(서버 응답 기준) 문을 열고 한 줄 메모를 물어본다. 처음부터 진행 중 휴식이 없었으면 바로 보낸다
  useEffect(() => {
    if (!ended || leaving.current) return
    leaving.current = true
    if (!sawRunning.current) {
      onNoSession?.()
      return
    }
    void waitForDoor().then(() => {
      if (!session) {
        onEnded?.()
        return
      }
      setMemoSession(session)
      setMemoOpen(true)
    })
  }, [ended, session, onEnded, onNoSession])

  // 메모를 남기거나 건너뛰면 팝업을 먼저 닫고 다음 프레임에 떠난다 — 화면 전환 스냅샷에 팝업이 남지 않게
  const finishMemo = () => {
    setMemoOpen(false)
    requestAnimationFrame(() => onEnded?.())
  }

  // 화면의 남은 시간이 0이 되면 서버에 끝났는지 묻는다(완료는 서버 시각으로 판단). 아직이면 1초 뒤 다시
  useEffect(() => {
    if (!running || remaining > 0) return
    retry()
    const timer = window.setInterval(retry, 1000)
    return () => window.clearInterval(timer)
  }, [running, remaining, retry])

  // 쉬는 동안 화면이 꺼지지 않게 — 꺼지면 센서 값이 오지 않아 휴대폰을 든 것을 알 수 없다
  useWakeLock(running)

  // 쉬는 동안 휴대폰을 들면 "동굴 문을 열까요?"를 저절로 띄우고, 다시 눕히면 닫고 계속 쉰다.
  // 들었다는 것만으로 끝내지 않는다(명세: 확인창 뒤 중도 종료). 센서가 없으면 아무 일도 없다(버튼으로만 연다)
  useFlatSensor(running, (sensor) => {
    if (sensor === 'tilted' && !confirming) {
      reset()
      setLifted(true)
      setConfirming(true)
    } else if (sensor === 'flat' && lifted && cancelState.status !== 'cancelling') {
      setLifted(false)
      setConfirming(false)
    }
  })

  const openConfirm = () => {
    if (!running) return
    reset()
    setLifted(false)
    setConfirming(true)
  }

  const confirmOpen = async () => {
    if (!session) return
    if (await cancel(session.sessionId)) setConfirming(false)
  }

  return (
    <main className={styles.page}>
      <CaveHeader showWool={false} onOpenGuide={onOpenGuide} />
      <div className={styles.body}>
        <Banner className={styles.banner} onClick={onOpenBanner}>동굴 문을 닫고 나의 시간에 집중해보세요</Banner>

        <div className={styles.scene}>
          {/* 끝났다는 응답을 받기 전까지는 닫혀 있다 — 열리는 것이 곧 끝났다는 표시 */}
          <CaveScene closed={!ended} decorations={decorations} />
        </div>

        <div className={styles.timer}>
          <RestTimer remainingSeconds={running ? remaining : ended ? 0 : undefined} />
        </div>

        <div className={styles.actions}>
          {state.status === 'error' && (
            <p className={styles.notice} role="alert">
              휴식 상태를 불러오지 못했어요.
              <Button variant="ghost" size="sm" onClick={retry}>
                다시 시도
              </Button>
            </p>
          )}
          {/* 끝나 문이 열리는 동안은 회색으로 바꾸지 않는다 — 그대로 시작 전 화면의 "동굴 문 닫기"로 이어진다(누름은 openConfirm 이 막음) */}
          <Button className={styles.action} size="lg" fullWidth disabled={!running && !ended} onClick={openConfirm}>
            동굴 문 열기
          </Button>
        </div>
      </div>

      <CaveOpenModal
        open={confirming && running}
        lifted={lifted}
        state={cancelState}
        onConfirm={() => void confirmOpen()}
        onClose={() => {
          setConfirming(false)
          setLifted(false)
        }}
      />

      {memoSession && (
        <AfterMemoModal
          open={memoOpen}
          endedStatus={memoSession.status}
          initialMemo={memoSession.afterMemo}
          state={memoState}
          onSave={async (memo) => {
            if (await saveMemo(memoSession.sessionId, memo)) finishMemo()
          }}
          onSkip={finishMemo}
        />
      )}
    </main>
  )
}
