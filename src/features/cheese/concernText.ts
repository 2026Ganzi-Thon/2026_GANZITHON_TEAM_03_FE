import type { ComfortType } from './types'

/**
 * 보여줄 본문(또는 목록 미리보기). 제목 필드가 생기기 전(2026-11-20 이전)에 이 앱으로 쓴 고민은 본문이 "제목\n내용"이고
 * 서버가 그 첫 줄을 제목으로 채웠다(V10) — 본문 첫 줄이 제목과 똑같으면 그 줄을 빼서 제목이 두 번 보이지 않게 한다.
 * 임의 결정(확인 필요): 새 고민도 내용 첫 줄을 제목과 똑같이 쓰면 그 줄이 빠져 보인다(드묾)
 */
export function concernBody(title: string, text: string): string {
  const trimmed = text.trim()
  const lineBreak = trimmed.search(/\r?\n/)
  const firstLine = (lineBreak === -1 ? trimmed : trimmed.slice(0, lineBreak)).trim()
  if (firstLine !== title.trim()) return trimmed
  return lineBreak === -1 ? '' : trimmed.slice(lineBreak).trim()
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
