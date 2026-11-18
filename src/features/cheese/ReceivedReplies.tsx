import { useState } from 'react'
import { Button } from '@/shared/ui'
import { formatConcernDate } from './concernText'
import type { MyConcernRepliesState } from './useMyConcernDetail'
import styles from './ReceivedReplies.module.css'

export interface ReceivedRepliesProps {
  state: MyConcernRepliesState
  onRetry?: () => void
}

/** 숙성 끝까지 남은 시간 글자: 1시간 안이면 "곧", 아니면 올림한 시간 */
function formatRemaining(maturesAt: string, now: number): string {
  const hours = Math.ceil((Date.parse(maturesAt) - now) / (60 * 60 * 1000))
  return hours <= 1 ? '곧' : `${hours}시간 뒤에`
}

/**
 * 내 고민에 다른 사람들이 남긴 위로 목록(시안 117:2179 의 구분선 아래): "익명의 폴리 · 날짜" + 위로 본문.
 * 숙성 중이면 위로 대신 남은 시간 안내를 보여준다.
 */
export function ReceivedReplies({ state, onRetry }: ReceivedRepliesProps) {
  // 남은 시간은 화면에 들어온 시각 기준으로 한 번만 계산한다(매초 갱신하지 않음)
  const [now] = useState(() => Date.now())

  return (
    <section className={styles.root} aria-label="받은 위로">
      {state.status === 'maturing' ? (
        // 임의 결정(확인 필요): 숙성 중 안내 문구 — 시안 없음
        <p className={styles.notice}>
          치즈가 숙성되고 있어요.
          <br />
          {formatRemaining(state.maturesAt, now)} 위로를 열어볼 수 있어요.
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
