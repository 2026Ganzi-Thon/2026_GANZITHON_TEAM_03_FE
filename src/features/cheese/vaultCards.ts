import type { ConcernStatus, MyConcernItem, SavedConcernItem } from './types'

/** 치즈 보관함 카드 한 장에 필요한 값. 내 고민·보관한 치즈 두 목록을 같은 카드로 그린다. */
export interface VaultCardItem {
  concernId: string
  title: string
  preview: string
  /** "더보기" 오른쪽의 작은 상태 글자 */
  label: string
  /** 숙성이 끝나 열어볼 수 있는 치즈 — 상태 글자를 강조색으로 */
  highlight: boolean
}

// 임의 결정(확인 필요): 상태 글자 — 시안 카드에는 상태 표시가 없다(모두 같은 우유병)
const STATUS_LABELS: Record<ConcernStatus, string> = {
  MATURING: '숙성 중',
  MATURED: '숙성 끝 · 열어보기',
  OPENED: '개봉함',
  SAVED: '보관함',
}

/**
 * 내 고민 목록 → 카드. 숙성이 끝나 아직 안 연 치즈(MATURED)를 앞으로 모으고 나머지는 서버 순서(최신순) 그대로.
 * 임의 결정(확인 필요): 홈의 "숙성이 끝난 치즈" 알림으로 들어왔을 때 열어볼 치즈가 첫 페이지에 보이게 하려고 앞으로 모은다.
 */
export function toMyVaultCards(items: MyConcernItem[]): VaultCardItem[] {
  const cards = items.map((item) => ({
    concernId: item.concernId,
    title: item.title,
    preview: item.preview,
    label: STATUS_LABELS[item.status],
    highlight: item.status === 'MATURED',
  }))
  return [...cards.filter((card) => card.highlight), ...cards.filter((card) => !card.highlight)]
}

/** 보관한 치즈 → 카드. 상태 글자 자리에 받은 위로 수(기본 위로 포함) */
export function toSavedVaultCards(items: SavedConcernItem[]): VaultCardItem[] {
  return items.map((item) => ({
    concernId: item.concernId,
    title: item.title,
    preview: item.preview,
    label: `위로 ${item.replyCount}개`,
    highlight: false,
  }))
}
