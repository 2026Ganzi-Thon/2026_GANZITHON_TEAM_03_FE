const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Asia/Seoul 기준 오늘 날짜 `YYYY-MM-DD`. `now`를 넘기면 그 시각을 기준으로 한다(테스트용). */
export function getTodaySeoul(now: Date = new Date()): string {
  // en-CA 로케일은 `YYYY-MM-DD` 로 나온다
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function toDayNumber(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day) / MS_PER_DAY
}

/**
 * `YYYY-MM-DD` 날짜를 기준일 대비 "오늘 / 어제 / N일 전 / 일주일 전 / YY.MM.DD" 로 바꾼다.
 * 기준일 `today`는 Asia/Seoul 날짜 문자열이고, 생략하면 지금의 서울 날짜다.
 * - 0일: 오늘, 1일: 어제, 2~6일: N일 전, 7~13일: 일주일 전, 그 이상(또는 미래): YY.MM.DD
 */
export function formatRelativeDate(date: string, today: string = getTodaySeoul()): string {
  const diff = toDayNumber(today) - toDayNumber(date)

  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  if (diff >= 2 && diff <= 6) return `${diff}일 전`
  if (diff >= 7 && diff <= 13) return '일주일 전'

  const [year, month, day] = date.split('-')
  return `${year.slice(2)}.${month}.${day}`
}
