import { useId, useLayoutEffect, useRef, useState } from 'react'
import milkBottleImage from '@/assets/images/milk-bottle.webp'
import { cx } from '@/shared/lib/cx'
import { splitConcernText, toPreviewBody } from './concernText'
import type { MyConcernItem } from './types'
import styles from './VaultCard.module.css'

export interface VaultCardProps {
  concern: MyConcernItem
}

/**
 * 치즈 보관함 카드: 우유병 + 제목(본문 첫 줄) + 본문 2줄 + "더보기".
 * 카드 자체는 누를 수 없고(상세 시안 없음) "더보기"만 본문 전체를 펼치고 접는다. 본문이 2줄 안에 다 들어가면 "더보기"를 숨긴다.
 * 임의 결정(확인 필요): 상태(숙성 중·숙성 끝·개봉·보관)별 그림·표시 구분 없음 — 시안이 모두 같은 우유병
 */
export function VaultCard({ concern }: VaultCardProps) {
  const { title, body } = splitConcernText(concern.preview)
  const preview = toPreviewBody(body)
  const bodyId = useId()
  const bodyRef = useRef<HTMLParagraphElement>(null)
  // 임의 결정(확인 필요): "더보기"는 그 자리에서 카드를 늘려 본문 전체를 펼침(줄바꿈 그대로), 다시 누르면 "접기" — 시안 없음
  const [expanded, setExpanded] = useState(false)
  // 접힌 상태에서 본문이 2줄을 넘는지(넘을 때만 "더보기"를 보인다)
  const [overflowing, setOverflowing] = useState(false)

  useLayoutEffect(() => {
    const element = bodyRef.current
    if (!element || expanded) return
    let active = true
    const measure = () => {
      if (active) setOverflowing(element.scrollHeight > element.clientHeight + 1)
    }
    measure()
    // 폭이 바뀌거나 글꼴이 늦게 들어와 줄 수가 달라지면 다시 잰다
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    void document.fonts?.ready.then(measure)
    return () => {
      active = false
      observer.disconnect()
    }
  }, [expanded, preview])

  return (
    <li className={styles.card}>
      <img src={milkBottleImage} alt="" width={71} height={110} className={styles.bottle} />
      <div className={styles.text}>
        <h3 className={styles.title}>{title}</h3>
        {preview && (
          <p ref={bodyRef} id={bodyId} className={cx(styles.body, expanded && styles.expanded)}>
            {expanded ? body : preview}
          </p>
        )}
        {preview && (overflowing || expanded) && (
          <button
            type="button"
            className={styles.more}
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? '접기' : '더보기'}
          </button>
        )}
      </div>
    </li>
  )
}

/** 로딩 자리: 카드와 같은 높이에 우유병·제목·본문 막대만 회색으로 */
export function VaultCardSkeleton() {
  return (
    <li className={cx(styles.card, styles.skeleton)} aria-hidden="true">
      <img src={milkBottleImage} alt="" width={71} height={110} className={styles.bottle} />
      <div className={styles.text}>
        <span className={cx(styles.bar, styles.barTitle)} />
        <span className={styles.bar} />
        <span className={cx(styles.bar, styles.barShort)} />
      </div>
    </li>
  )
}
