import type { ConcernCard } from '@/shared/types'
import type { GuideStep } from '@/shared/ui'
import type { VaultCardItem } from './vaultCards'

// 우유와 치즈·치즈 보관함 사용법 안내(오른쪽 위 `!`). 안내 중에는 실제 목록 대신 아래 예시를 보여 화살표가 늘 같은 자리를 가리킨다

export const CHEESE_GUIDE_STEPS: GuideStep[] = [
  { target: 'milk-list', title: '이웃의 우유를 골라요', body: '다른 폴리가 남긴 고민이에요. 옆으로 넘기면 더 있어요.' },
  { target: 'reply', title: '위로 남기기를 눌러요', body: '고른 고민을 읽고 위로를 남겨요.' },
  { target: 'write', title: '내 고민은 치즈가 돼요', body: '고민을 남기면 시간이 지나 치즈로 익어요. 익으면 받은 위로를 열어 봐요.' },
  { target: 'vault', title: '내 치즈 보관함', body: '내가 쓴 고민과 모아 둔 치즈를 봐요.' },
]

export const VAULT_GUIDE_STEPS: GuideStep[] = [
  { target: 'tabs', title: '두 칸으로 나눠 봐요', body: '내 고민에는 내가 쓴 고민이, 보관한 치즈에는 모아 둔 치즈가 있어요.' },
  { target: 'status', title: '치즈 상태를 봐요', body: '숙성 중인 고민은 시간이 지나면 열어 볼 수 있어요.' },
  { target: 'more', title: '더보기로 위로를 읽어요', body: '받은 위로를 모두 볼 수 있어요.' },
]

const created = '2026-11-20T09:00:00Z'

export const CHEESE_GUIDE_CONCERNS: ConcernCard[] = [
  { concernId: 'guide-1', title: '친구와 사이가 멀어진 것 같아요', preview: '요즘 연락이 뜸해졌는데 먼저 말을 걸어야 할지 모르겠어요.', comfortType: 'EMPATHY', createdAt: created },
  { concernId: 'guide-2', title: '첫 출근이 너무 떨려요', preview: '다음 주가 첫 출근인데 실수할까 봐 잠이 안 와요.', comfortType: 'EMPATHY', createdAt: created },
  { concernId: 'guide-3', title: '잠이 잘 안 와요', preview: '누우면 생각이 많아져서 새벽까지 깨어 있어요.', comfortType: 'EMPATHY', createdAt: created },
]

export const VAULT_GUIDE_CARDS: VaultCardItem[] = [
  { concernId: 'guide-1', title: '이사 가는 게 무서워요', preview: '낯선 동네에서 혼자 잘 지낼 수 있을지 걱정돼요.', label: '숙성 끝 · 열어보기', highlight: true },
  { concernId: 'guide-2', title: '진로를 바꿔도 될까요', preview: '지금 하는 공부가 맞는지 자꾸 고민돼요.', label: '개봉함', highlight: false },
  { concernId: 'guide-3', title: '운동을 꾸준히 하고 싶어요', preview: '며칠 하다가 자꾸 그만두게 돼요.', label: '숙성 중', highlight: false },
]
