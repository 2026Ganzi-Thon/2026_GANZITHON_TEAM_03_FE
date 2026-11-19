import { Badge } from '@/shared/ui'
import { COMFORT_TYPE_LABELS, concernBody, formatConcernDate } from './concernText'
import type { ConcernDetail } from './types'
import styles from './ConcernReader.module.css'

export interface ConcernReaderProps {
  /** 없으면 제목·본문 자리를 회색 막대로 보여준다(로딩) */
  concern?: ConcernDetail
  /** 작성자 자리 글자. 기본 "익명의 폴리"(내 고민은 "나") */
  authorLabel?: string
}

/** 고민 상세의 읽는 영역: 제목, 위로 방식 배지, "익명의 폴리 · 날짜"(작성자 글자는 바꿀 수 있음), 본문(줄바꿈 유지). */
export function ConcernReader({ concern, authorLabel = '익명의 폴리' }: ConcernReaderProps) {
  if (!concern) {
    return (
      <div className={styles.root} role="status" aria-label="고민을 불러오는 중">
        <span className={styles.skeletonTitle} />
        <span className={styles.skeletonMeta} />
        <div className={styles.skeletonBody}>
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.barShort} />
        </div>
      </div>
    )
  }

  const { title } = concern
  const body = concernBody(title, concern.content)

  return (
    <article className={styles.root}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.meta}>
        <span>{authorLabel}</span>
        <span className={styles.dot} aria-hidden="true" />
        <time dateTime={concern.createdAt}>{formatConcernDate(concern.createdAt)}</time>
        {/* 임의 결정(확인 필요): 위로 방식 배지는 날짜 줄 오른쪽에 둔다 — 시안에 없음 */}
        <Badge className={styles.badge}>{COMFORT_TYPE_LABELS[concern.comfortType]}</Badge>
      </p>
      {body && <p className={styles.body}>{body}</p>}
    </article>
  )
}
