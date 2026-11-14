import { useEffect, useRef, useState } from 'react'
import sheepImage from '@/assets/images/sheep.webp'
import styles from './SheepHero.module.css'

/**
 * 양 먹이주기 화면 위쪽의 양 일러스트(234×234, 가운데). 시안에서 좌우 반전되어 있다.
 * 이미지가 오기 전에는 같은 자리에 원형 스켈레톤을 보이고, 오면 짧게 페이드인한다(이미 캐시에 있으면 바로 보인다).
 */
export function SheepHero() {
  const imgRef = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true)
  }, [])

  return (
    <div className={styles.frame}>
      {!loaded && <span className={styles.skeleton} aria-hidden="true" />}
      <img
        ref={imgRef}
        className={`${styles.sheep} ${loaded ? styles.loaded : ''}`}
        src={sheepImage}
        width={234}
        height={234}
        alt="웃고 있는 양"
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
