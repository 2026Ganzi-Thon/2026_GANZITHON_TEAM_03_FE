import { useState } from 'react'
import { FALLBACK_NAME, NAME_SLOT, getGreeting, pickGreetingIndex } from './greetings'
import styles from './HomeGreeting.module.css'

export interface HomeGreetingProps {
  /** 닉네임. undefined 면 아직 불러오는 중이라 이름 자리에 막대를 보여준다. null 이면 닉네임 없음 */
  nickname: string | null | undefined
  /** 미리보기용: 인사말 번호를 고정한다. 없으면 마운트할 때마다 무작위 */
  index?: number
}

/** 인사말(두 줄). 화면에 들어올 때 한 번 고르고, 머무는 동안은 바뀌지 않는다. 이름 자리만 응답을 기다린다. */
export function HomeGreeting({ nickname, index }: HomeGreetingProps) {
  const [randomIndex] = useState(pickGreetingIndex)
  const greeting = getGreeting(index ?? randomIndex)
  const loading = nickname === undefined

  const renderLine = (line: string) => {
    const [before, after] = line.split(NAME_SLOT)
    if (after === undefined) return line
    return (
      <>
        {before}
        {loading ? <span className={styles.nameSkeleton} aria-hidden="true" /> : (nickname ?? FALLBACK_NAME)}
        {after}
      </>
    )
  }

  return (
    <h1 className={styles.greeting} aria-busy={loading || undefined}>
      <span className={styles.line}>{renderLine(greeting.first)}</span>
      <span className={styles.line}>{renderLine(greeting.second)}</span>
    </h1>
  )
}
