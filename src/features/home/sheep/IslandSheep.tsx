import { useEffect, useRef, useState } from 'react'
import type { SheepIslandLayer } from './sheepLayers'
import { SheepPlayer } from './sheepPlayer'
import styles from './IslandSheep.module.css'

export interface IslandSheepProps {
  /** 섬에 놓인 가구(놓인 그림·바닥에 깔리는지). 양 앞에 오는 가구가 양을 가린다 */
  layers?: SheepIslandLayer[]
}

/**
 * 홈 섬에서 돌아다니는 양. 섬 그림(IslandScene)과 같은 정사각형을 덮는 캔버스 — 페이지가 섬 위에 겹쳐 넣는다(HomePage).
 * 홈에만 둔다: 섬 꾸미기·동굴 문 닫기 화면에는 양이 없다(사용자 지시).
 * 그림이 준비되기 전에는 아무것도 그리지 않고, 준비되면 서서히 나타난다. 자리를 차지하지 않아 섬 레이아웃은 그대로다.
 */
export function IslandSheep({ layers = [] }: IslandSheepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<SheepPlayer | null>(null)
  const [ready, setReady] = useState(false)
  // 페이지가 그릴 때마다 새 배열을 넘겨도 가구가 같으면 다시 재지 않게 내용으로 비교한다
  const layersKey = JSON.stringify(layers.map((layer) => [layer.src, layer.flat]))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const player = new SheepPlayer(canvas, () => setReady(true))
    playerRef.current = player
    return () => {
      player.destroy()
      playerRef.current = null
    }
  }, [])

  useEffect(() => {
    const parsed = JSON.parse(layersKey) as [string, boolean][]
    playerRef.current?.setLayers(parsed.map(([src, flat]) => ({ src, flat })))
  }, [layersKey])

  return <canvas ref={canvasRef} className={ready ? `${styles.canvas} ${styles.ready}` : styles.canvas} aria-hidden="true" />
}
