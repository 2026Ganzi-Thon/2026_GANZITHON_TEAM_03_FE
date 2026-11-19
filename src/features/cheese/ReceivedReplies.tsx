import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui'
import { formatConcernDate } from './concernText'
import type { MyConcernRepliesState } from './useMyConcernDetail'
import styles from './ReceivedReplies.module.css'

export interface ReceivedRepliesProps {
  state: MyConcernRepliesState
  onRetry?: () => void
}

/** 숙성 끝까지 남은 시간 글자(1초마다 줄어듦): "7분 42초 뒤에", 1분 안이면 "42초 뒤에", 끝났으면 "곧"(서버 숙성 시간 10분 — 백엔드 V15) */
function formatRemaining(maturesAt: string, now: number): string {
  const seconds = Math.ceil((Date.parse(maturesAt) - now) / 1000)
  if (seconds <= 0) return '곧'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  if (hours > 0) return `${hours}시간 ${minutes}분 뒤에`
  return minutes > 0 ? `${minutes}분 ${rest}초 뒤에` : `${rest}초 뒤에`
}

/**
 * 내 고민에 다른 사람들이 남긴 위로 목록(시안 117:2179 의 구분선 아래): "익명의 폴리 · 날짜" + 위로 본문.
 * 숙성 중이면 위로 대신 남은 시간 안내를 보여준다.
 */
export function ReceivedReplies({ state, onRetry }: ReceivedRepliesProps) {
  // 남은 시간은 1초마다 다시 계산한다(초 단위로 줄어드는 모습). 숙성이 끝나면 상세를 다시 받아 열린다(useMyConcernDetail)
  const [now, setNow] = useState(() => Date.now())
  const maturing = state.status === 'maturing'
  useEffect(() => {
    if (!maturing) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [maturing])

  return (
    <section className={styles.root} aria-label="받은 위로">
      {state.status === 'maturing' ? (
        // 임의 결정(확인 필요): 숙성 중 안내 문구 — 시안 없음
        <p className={styles.notice}>
          치즈가 숙성되고 있어요.
          <br />
          <span className={styles.countdown}>{formatRemaining(state.maturesAt, now)}</span> 위로를 열어볼 수 있어요.
        </p>
      ) : state.status === 'error' ? (
        <div className={styles.error} role="alert">
          <p className={styles.notice}>위로를 불러오지 못했어요.</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            다시 시도
          </Button>
        </div>
      ) : state.status === 'loading' ? (
        <ul className={styles.list} role="status" aria-label="위로를 불러오는 중">
          {[0, 1].map((index) => (
            <li key={index} className={styles.item}>
              <span className={styles.barMeta} />
              <span className={styles.bar} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className={styles.list}>
          {state.replies.map((reply) => (
            <li key={reply.replyId} className={styles.item}>
              <p className={styles.meta}>
                {/* 임의 결정(확인 필요): 기본 위로(fromSystem)는 "폴리의 섬"으로 구분 — 명세는 "구분해 표시할 수 있다"까지만 */}
                <span>{reply.fromSystem ? '폴리의 섬' : '익명의 폴리'}</span>
                <span className={styles.dot} aria-hidden="true" />
                <time dateTime={reply.createdAt}>{formatConcernDate(reply.createdAt)}</time>
              </p>
              <p className={styles.content}>{reply.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
