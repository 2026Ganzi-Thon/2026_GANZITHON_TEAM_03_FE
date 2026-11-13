import styles from './IslandTitle.module.css'

export interface IslandTitleProps {
  /** "{name}의 섬" 으로 보여줄 이름. null 이면 아직 모르는 것이라 이름 자리에 막대를 보여준다 */
  name: string | null
}

/** 화면 왼쪽 위에 붙어 있는 초록 알약 "OO의 섬". 위아래로 화면 가장자리와 이어지는 둥근 모서리가 달려 있다. */
export function IslandTitle({ name }: IslandTitleProps) {
  return (
    <div className={styles.root}>
      <span className={`${styles.corner} ${styles.cornerTop}`} aria-hidden="true" />
      <p className={styles.pill} aria-busy={name === null || undefined}>
        {name === null ? <span className={styles.nameSkeleton} aria-hidden="true" /> : name}의 섬
      </p>
      <span className={styles.corner} aria-hidden="true" />
    </div>
  )
}
