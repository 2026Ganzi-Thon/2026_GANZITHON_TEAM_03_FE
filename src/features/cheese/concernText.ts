import type { ComfortType } from './types'

/**
 * 임의 결정(확인 필요): API 에 고민 제목 필드가 없어서(백엔드 요청 대상) 본문 첫 줄을 제목 자리에 보여준다.
 * 제목 필드가 생기면 이 함수를 지우고 응답의 title 을 쓴다.
 */
export function splitConcernText(text: string): { title: string; body: string } {
  const trimmed = text.trim()
  const lineBreak = trimmed.search(/\r?\n/)
  if (lineBreak === -1) return { title: trimmed, body: '' }
  return { title: trimmed.slice(0, lineBreak).trim(), body: trimmed.slice(lineBreak).trim() }
}

/** 목록 카드용 본문 미리보기: 줄바꿈을 공백으로 이어서 줄 수 제한(3줄)이 글자 수에 맞게 걸리게 한다. */
export function toPreviewBody(body: string): string {
  return body.replace(/\s*\n+\s*/g, ' ')
}

export const COMFORT_TYPE_LABELS: Record<ComfortType, string> = {
  EMPATHY: '공감이 필요해요',
  EXPERIENCE: '경험을 듣고 싶어요',
  ADVICE: '조언도 괜찮아요',
}

/** `2026-11-08T01:00:00Z` → `2026.11.08` (Asia/Seoul 기준) */
export function formatConcernDate(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(iso))
    .replaceAll('-', '.')
}
