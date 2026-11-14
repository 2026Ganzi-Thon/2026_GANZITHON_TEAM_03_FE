import { Button } from '@/shared/ui'
import { formatRelativeDate } from '@/shared/lib/formatRelativeDate'
import styles from './EmotionRecordList.module.css'

export interface EmotionRecordRow {
  id: string
  /** 한 줄로 보여줄 글 (길면 말줄임) */
  text: string
  /** `YYYY-MM-DD` */
  date: string
}

export interface EmotionRecordListProps {
  title: string
  status: 'loading' | 'error' | 'success'
  rows: EmotionRecordRow[]
  /** 기준일(서울 날짜). 상대 날짜 계산용 */
  today: string
  emptyText: string
  onRetry?: () => void
}

/** "지난 먹이주기 기록"·"내 지푸라기들"처럼 왼쪽에 글, 오른쪽에 상대 날짜가 있는 목록. */
export function EmotionRecordList({ title, status, rows, today, emptyText, onRetry }: EmotionRecordListProps) {
  const headingId = `${title}-heading`

  return (
    <section className={styles.root} aria-labelledby={headingId} aria-busy={status === 'loading' || undefined}>
      <h2 id={headingId} className={styles.title}>
        {title}
      </h2>

      {status === 'loading' && <p className={styles.message}>불러오는 중이에요…</p>}

      {status === 'error' && (
        <div className={styles.error} role="alert">
          <p className={styles.message}>기록을 불러오지 못했어요.</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            다시 시도
          </Button>
        </div>
      )}

      {status === 'success' && rows.length === 0 && <p className={styles.message}>{emptyText}</p>}

      {status === 'success' && rows.length > 0 && (
        <ul className={styles.list}>
          {rows.map((row) => (
            <li key={row.id} className={styles.row}>
              <span className={styles.text}>{row.text}</span>
              <time className={styles.date} dateTime={row.date}>
                {formatRelativeDate(row.date, today)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
