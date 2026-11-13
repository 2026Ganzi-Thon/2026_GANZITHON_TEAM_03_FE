import { useState } from 'react'
import { getGreeting, pickGreetingIndex } from './greetings'
import styles from './HomeGreeting.module.css'

export interface HomeGreetingProps {
  nickname: string | null
  /** 미리보기용: 인사말 번호를 고정한다. 없으면 마운트할 때마다 무작위 */
  index?: number
}

/** 인사말(두 줄). 화면에 들어올 때 한 번 고르고, 머무는 동안은 바뀌지 않는다. */
export function HomeGreeting({ nickname, index }: HomeGreetingProps) {
  const [randomIndex] = useState(pickGreetingIndex)
  const greeting = getGreeting(index ?? randomIndex, nickname)

  return (
    <h1 className={styles.greeting}>
      <span className={styles.line}>{greeting.first}</span>
      <span className={styles.line}>{greeting.second}</span>
    </h1>
  )
}
