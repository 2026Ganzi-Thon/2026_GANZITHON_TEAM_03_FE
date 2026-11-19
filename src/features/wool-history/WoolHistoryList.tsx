import { useEffect, useRef } from 'react'
import { Button } from '@/shared/ui'
import type { WoolHistoryState, WoolTransaction } from './types'
import styles from './WoolHistoryList.module.css'

export interface WoolHistoryListProps {
  state: WoolHistoryState
  /** 서울 기준 오늘 `YYYY-MM-DD` — "오늘"·"어제" 표시 기준 */
  today: string
  onLoadMore: () => void
  onRetry: () => void
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: 'numeric',
  minute: '2-digit',
})

function dayNumber(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / 86_400_000
}

/** 날짜 제목: 오늘 / 어제 / 11월 14일 금요일 (해가 다르면 연도도) */
function dayLabel(date: string, today: string) {
  const diff = dayNumber(today) - dayNumber(date)
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  const [year, month, day] = date.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  const prefix = date.slice(0, 4) === today.slice(0, 4) ? '' : `${year}년 `
  return `${prefix}${month}월 ${day}일 ${weekday}요일`
}

/**
 * 거래 이름. 백엔드는 돌봄 완료 적립(EARN)·완료 취소 회수(REVERSE)·섬 꾸미기 구매(SPEND)를 만든다.
 * 행동 이름·산 아이템은 응답에 없어(백엔드 CareService.transactions) 종류로만 쓴다.
 * 임의 결정(확인 필요): "돌봄 완료"·"돌봄 완료 취소"·"섬 꾸미기 구매", 모르는 종류는 금액 부호로 "양털 받음"·"양털 사용"
 */
function transactionLabel(item: WoolTransaction) {
  if (item.transactionType === 'EARN') return '돌봄 완료'
  if (item.transactionType === 'REVERSE') return '돌봄 완료 취소'
  if (item.transactionType === 'SPEND') return '섬 꾸미기 구매'
  return item.amount >= 0 ? '양털 받음' : '양털 사용'
}

function amountLabel(amount: number) {
  return amount >= 0 ? `+${amount}개` : `−${Math.abs(amount)}개`
}

/** 행 모양 회색 막대 — 실제 행과 같은 높이 */
function SkeletonRows({ count }: { count: number }) {
  return (
    <ul className={styles.list} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className={styles.row}>
          <span className={styles.main}>
            <span className={styles.barLabel} />
            <span className={styles.barTime} />
          </span>
          <span className={styles.barAmount} />
        </li>
      ))}
    </ul>
  )
}

/**
 * 양털 변동 내역을 서울 날짜별로 보여준다(최신순). 목록 끝이 보이면 다음 페이지를 저절로 받고("더 보기"를 눌러도 된다),
 * 받는 동안은 목록 아래에 행 모양 막대를 붙인다 — 위쪽은 움직이지 않는다.
 * 임의 결정(확인 필요): 시안이 없어 지난 먹이주기 기록 목록 톤(14px, 날짜 제목 16px)으로 만들었다.
 */
export function WoolHistoryList({ state, today, onLoadMore, onRetry }: WoolHistoryListProps) {
  const moreRef = useRef<HTMLButtonElement>(null)
  const canAutoLoad = state.status === 'success' && state.hasNext && !state.loadingMore && !state.moreError

  // "더 보기"가 화면 아래 200px 안에 들어오면 다음 페이지를 받는다. 실패했으면 저절로 다시 받지 않는다(버튼으로)
  useEffect(() => {
    const target = moreRef.current
    if (!canAutoLoad || !target || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onLoadMore()
    }, { rootMargin: '0px 0px 200px 0px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [canAutoLoad, onLoadMore])

  if (state.status === 'loading') {
    return (
      <div className={styles.root} role="status" aria-label="양털 내역을 불러오는 중">
        <section className={styles.day}>
          <span className={styles.barDay} aria-hidden="true" />
          <SkeletonRows count={6} />
        </section>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={styles.error} role="alert">
        <p className={styles.message}>양털 내역을 불러오지 못했어요.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    )
  }

  if (state.days.length === 0) {
    // 임의 결정(확인 필요): 빈 목록 문구
    return (
      <div className={styles.empty}>
        <p className={styles.message}>아직 양털 내역이 없어요.</p>
        <p className={styles.message}>돌봄 행동을 완료하면 양털을 받아요.</p>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {state.days.map((day) => (
        <section key={day.date} className={styles.day} aria-labelledby={`wool-day-${day.date}`}>
          <h2 id={`wool-day-${day.date}`} className={styles.dayTitle}>
            {dayLabel(day.date, today)}
          </h2>
          <ul className={styles.list}>
            {day.items.map((item) => (
              <li key={item.transactionId} className={styles.row}>
                <span className={styles.main}>
                  <span className={styles.label}>{transactionLabel(item)}</span>
                  <time className={styles.time} dateTime={item.createdAt}>
                    {timeFormat.format(new Date(item.createdAt))}
                  </time>
                </span>
                <span className={item.amount >= 0 ? styles.plus : styles.minus}>{amountLabel(item.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {state.loadingMore && (
        <div role="status" aria-label="더 불러오는 중">
          <SkeletonRows count={3} />
        </div>
      )}
      {state.moreError && (
        <div className={styles.error} role="alert">
          <p className={styles.message}>더 불러오지 못했어요.</p>
          <Button variant="outline" size="sm" onClick={onLoadMore}>
            다시 시도
          </Button>
        </div>
      )}
      {canAutoLoad && (
        <Button ref={moreRef} variant="ghost" size="sm" className={styles.more} onClick={onLoadMore}>
          더 보기
        </Button>
      )}
    </div>
  )
}
