const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** `YYYY-MM-DD` → "2026년 11월 14일 금요일". 기록 날짜는 서울 날짜라 시간대 변환 없이 그 날짜의 요일을 쓴다. */
export function formatRecordDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${year}년 ${month}월 ${day}일 ${weekday}요일`
}
