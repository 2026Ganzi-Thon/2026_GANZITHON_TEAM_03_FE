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
  /** 행을 눌렀을 때(그 기록의 상세로). 없으면 행은 누를 수 없는 글이다 */
  onSelect?: (id: string) => void
}

/** 로딩 막대 길이(행마다 조금 다르게) */
const SKELETON_WIDTHS = ['62%', '48%', '56%']

/** "지난 먹이주기 기록"·"내 지푸라기들"처럼 왼쪽에 글, 오른쪽에 상대 날짜가 있는 목록. `onSelect` 가 있으면 행이 버튼이 된다. */
export function EmotionRecordList({ title, status, rows, today, emptyText, onRetry, onSelect }: EmotionRecordListProps) {
  const headingId = `${title}-heading`

  return (
    <section className={styles.root} aria-labelledby={headingId} aria-busy={status === 'loading' || undefined}>
      <h2 id={headingId} className={styles.title}>
        {title}
      </h2>

      {status === 'loading' && (
        <div className={styles.list}>
          <span className={styles.srOnly}>불러오는 중이에요</span>
          {SKELETON_WIDTHS.map((width) => (
            <div key={width} className={styles.row} aria-hidden="true">
              <span className={styles.skeleton} style={{ width }} />
              <span className={`${styles.skeleton} ${styles.skeletonDate}`} />
            </div>
          ))}
        </div>
      )}

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
          {rows.map((row) => {
            const content = (
              <>
                <span className={styles.text}>{row.text}</span>
                <time className={styles.date} dateTime={row.date}>
                  {formatRelativeDate(row.date, today)}
                </time>
              </>
            )
            return (
              <li key={row.id}>
                {onSelect ? (
                  <button type="button" className={`${styles.row} ${styles.rowButton}`} onClick={() => onSelect(row.id)}>
                    {content}
                  </button>
                ) : (
                  <div className={styles.row}>{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
