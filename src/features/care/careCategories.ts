import type { CareAction } from './types'

// 돌봄 행동 분류. 백엔드 care_actions 에 분류 칸이 없어서(V7 마이그레이션) 행동 이름으로 프론트에서 붙인다.
// 표는 시안(4 양털 모으기)의 16개 행동이다. 서버가 분류를 주면 이 파일을 지우고 응답 값을 쓴다.

export type CareCategoryId = 'move' | 'mind' | 'rest' | 'daily' | 'etc'

export interface CareCategory {
  id: CareCategoryId
  label: string
}

const BASE_CATEGORIES: CareCategory[] = [
  { id: 'move', label: '움직이기' },
  { id: 'mind', label: '마음돌봄' },
  { id: 'rest', label: '쉬어가기' },
  { id: 'daily', label: '일상가꾸기' },
]

const ETC_CATEGORY: CareCategory = { id: 'etc', label: '기타' }

const NAMES: Record<Exclude<CareCategoryId, 'etc'>, string[]> = {
  move: ['물 한 잔 마시기', '간단한 간식 먹기', '10분 산책하기', '편안한 옷으로 갈아입기'],
  mind: [
    '양 먹이주기: 오늘의 마음을 한 줄로 적기',
    '오늘 내가 애쓴 일 하나 알아주기',
    '내 기분을 색이나 낙서로 표현하기',
    '편한 사람에게 내 기분 이야기하기',
  ],
  rest: [
    '동굴 5분 닫기: 휴대폰을 5분 뒤집어보세요',
    '불필요한 알림 잠시 끄기',
    '좋아하는 음악 한 곡 듣기',
    '따뜻한 음료 천천히 마시기',
  ],
  daily: ['침구 정리하기', '책상 위 물건 정리하기', '사용한 컵 하나 씻기', '마음에 드는 순간 사진으로 남기기'],
}

/** 띄어쓰기·문장부호 차이로 놓치지 않게 글자만 비교한다 */
const normalize = (name: string) => name.replace(/[\s:.,!?~]/g, '')

const CATEGORY_BY_NAME = new Map<string, CareCategoryId>(
  (Object.entries(NAMES) as [CareCategoryId, string[]][]).flatMap(([id, names]) =>
    names.map((name) => [normalize(name), id] as const),
  ),
)

export function categoryOf(action: CareAction): CareCategoryId {
  return CATEGORY_BY_NAME.get(normalize(action.name)) ?? 'etc'
}

const ALL_CATEGORY: CareCategory = { id: 'etc', label: '전체' }

export interface CareGroups {
  /** 보여줄 탭. 표에 맞는 행동이 하나도 없으면 "전체" 탭 하나 */
  categories: CareCategory[]
  /** 탭별 행동(서버 순서 그대로) */
  byCategory: Record<CareCategoryId, CareAction[]>
}

/**
 * 서버 목록을 탭으로 나눈다. 기본 4개 탭은 비어 있어도 시안대로 늘 보이고,
 * 표에 없는 행동이 있으면 맨 뒤에 "기타" 탭을 붙인다. 표에 맞는 행동이 하나도 없으면(서버 이름이 시안과 전부 다름) 4개 탭이 모두 비므로 "전체" 탭 하나로 보여준다
 * — 탭 줄 자체는 남겨 데이터가 와도 목록·버튼 자리가 그대로다.
 */
export function groupCareActions(actions: CareAction[]): CareGroups {
  const byCategory: Record<CareCategoryId, CareAction[]> = { move: [], mind: [], rest: [], daily: [], etc: [] }
  for (const action of actions) byCategory[categoryOf(action)].push(action)
  const matched = actions.length - byCategory.etc.length
  if (actions.length > 0 && matched === 0) return { categories: [ALL_CATEGORY], byCategory }
  return { categories: byCategory.etc.length > 0 ? [...BASE_CATEGORIES, ETC_CATEGORY] : BASE_CATEGORIES, byCategory }
}

/** 로딩 중 스켈레톤에 그릴 기본 탭 */
export const SKELETON_CATEGORIES = BASE_CATEGORIES
