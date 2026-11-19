import type { WoolHistoryDay, WoolTransaction } from './types'

const seoulDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** UTC 시각 → 서울 날짜 `YYYY-MM-DD` */
export function toSeoulDate(iso: string): string {
  return seoulDate.format(new Date(iso))
}

/**
 * 최신순 내역을 서울 날짜별로 묶는다. 페이지 경계에서 같은 날짜가 둘로 나뉘지 않게 받은 페이지를 모두 펼친 뒤 묶는다.
 * 페이지 사이에 새 거래가 끼어 같은 거래가 두 번 오면(offset 방식) 한 번만 둔다.
 */
export function groupByDay(items: WoolTransaction[]): WoolHistoryDay[] {
  const seen = new Set<string>()
  const days: WoolHistoryDay[] = []
  for (const item of items) {
    if (seen.has(item.transactionId)) continue
    seen.add(item.transactionId)
    const date = toSeoulDate(item.createdAt)
    const last = days[days.length - 1]
    if (last?.date === date) last.items.push(item)
    else days.push({ date, items: [item] })
  }
  return days
}
