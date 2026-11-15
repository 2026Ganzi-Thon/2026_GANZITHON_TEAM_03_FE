import { getTodaySeoul } from '@/shared/lib/formatRelativeDate'
import type { ComfortType, Emotion, Id, IsoDateTime } from '@/shared/types'

// 가짜 DB 의 처음 상태. 예전에 각 기능 *Api.ts 에 있던 mock 데이터를 그대로 옮겼다.

/** 감정 기록 한 행. 감정은 ID 로만 들고 있다가 읽을 때 감정 목록과 합친다(서버 조인 흉내). */
export interface MockEmotionRecordRow {
  recordId: Id
  recordDate: string
  memo: string | null
  emotionIds: Id[]
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface MockConcernRow {
  concernId: Id
  content: string
  comfortType: ComfortType
  createdAt: IsoDateTime
  /** 내가 위로를 남겼는지 */
  alreadyReplied: boolean
}

export interface MockDbState {
  user: {
    /** 초기 설정 전이면 null */
    nickname: string | null
    ageGroup: string | null
    introduction: string
    profileCompleted: boolean
  }
  wool: { balance: number; updatedAt: IsoDateTime | null }
  emotions: Emotion[]
  /** 최신 날짜가 앞 */
  emotionRecords: MockEmotionRecordRow[]
  nextEmotionRecordId: number
  concerns: MockConcernRow[]
  /** 섬 꾸미기 아이템 보유. 섬 꾸미기 브랜치가 병합되면 그쪽 mock 을 여기로 옮긴다 */
  island: { ownedItemIds: string[] }
}

// 임의 결정(확인 필요): 감정 7개와 code(JOY…CALM)를 임의로 만들었다 — Figma 칩 이름 그대로, 실제 목록은 기획 합의 필요
const EMOTIONS: Emotion[] = [
  ['JOY', '기쁨'],
  ['SADNESS', '슬픔'],
  ['REGRET', '아쉬움'],
  ['FEAR', '두려움'],
  ['TIRED', '지침'],
  ['ANXIETY', '불안'],
  ['CALM', '평온'],
].map(([code, name], index) => ({
  emotionId: String(index + 1),
  code,
  name,
  displayOrder: index + 1,
  active: true,
}))

/** 오늘(서울)에서 `days` 일 전 `YYYY-MM-DD`. 시드를 처음 만들 때 한 번만 계산해 절대 날짜로 저장한다. */
function daysAgo(days: number): string {
  const [year, month, day] = getTodaySeoul().split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day - days)).toISOString().slice(0, 10)
}

function record(
  recordId: string,
  recordDate: string,
  memo: string | null,
  emotionIds: string[],
  { edited = false } = {},
): MockEmotionRecordRow {
  const at = `${recordDate}T03:00:00Z`
  // 상세 화면의 "수정됨" 표시를 볼 수 있게 일부 기록은 updatedAt 을 몇 시간 뒤로 둔다
  const updatedAt = edited ? `${recordDate}T09:00:00Z` : at
  return { recordId, recordDate, memo, emotionIds, createdAt: at, updatedAt }
}

function concern(concernId: string, createdAt: string, comfortType: ComfortType, content: string): MockConcernRow {
  return { concernId, content, comfortType, createdAt, alreadyReplied: false }
}

export function createSeed(): MockDbState {
  return {
    user: { nickname: '온기', ageGroup: null, introduction: '', profileCompleted: true },
    // 임의 결정(확인 필요): 양털 시드 47 — 섬 꾸미기 시안 값. 아이템 값이 12·24라 12로는 하나밖에 못 산다
    wool: { balance: 47, updatedAt: null },
    emotions: EMOTIONS,
    emotionRecords: [
      record('104', daysAgo(1), '산책하고 나니 조금 편안해졌다.', ['7']),
      record('103', daysAgo(3), null, ['5', '6']),
      record('102', daysAgo(7), '일이 많아서 정신없이 지나간 하루.\n그래도 저녁에 먹은 국수가 맛있었다.', ['5'], { edited: true }),
      record('101', daysAgo(15), '오랜만에 친구를 만나서 많이 웃었다.', ['1']),
    ],
    nextEmotionRecordId: 105,
    // 본문 첫 줄이 제목 자리에 보인다
    concerns: [
      concern('201', '2026-11-12T01:00:00Z', 'EMPATHY', '취업 준비가 길어지니 자꾸 비교하게 돼요\n친구들은 하나둘 자리를 잡는데 저만 제자리인 것 같아요.\n응원해 주는 가족에게도 미안해서 요즘은 말수가 줄었어요.\n오늘도 이력서를 열었다가 한참 보고만 있었어요.'),
      concern('202', '2026-11-11T09:30:00Z', 'ADVICE', '팀 사람들과 어떻게 가까워질 수 있을까요\n이직한 지 석 달인데 점심시간이 아직도 어색해요.\n먼저 말을 걸고 싶은데 타이밍을 놓치곤 해요.'),
      concern('203', '2026-11-10T12:00:00Z', 'EXPERIENCE', '혼자 사는 게 문득 외로운 밤이 있어요\n퇴근하고 불을 켜면 너무 조용해서 괜히 티비를 틀어 놓아요.\n다들 이런 시기를 어떻게 지나왔는지 궁금해요.'),
      concern('204', '2026-11-10T03:20:00Z', 'EMPATHY', '아무것도 하기 싫은 주말이었어요\n해야 할 일은 쌓여 있는데 침대에서 하루가 다 갔어요. 그런 제가 한심하게 느껴져요.'),
      concern('205', '2026-11-09T15:10:00Z', 'ADVICE', '운동을 시작하고 싶은데 작심삼일이에요\n매번 의욕만 앞서고 일주일을 못 가요.\n작게 시작하는 방법이 있을까요?'),
      concern('206', '2026-11-09T05:45:00Z', 'EXPERIENCE', '오랜 친구와 멀어진 것 같아요\n연락이 뜸해지다 보니 이제는 먼저 말 걸기가 어려워졌어요. 이런 경험 있으세요?'),
      concern('207', '2026-11-08T11:00:00Z', 'EMPATHY', '시험 결과가 나오기 전날이에요\n잠이 안 오고 자꾸 최악의 결과만 떠올라요. 그냥 누군가 괜찮다고 말해줬으면 좋겠어요.'),
      concern('208', '2026-11-07T08:30:00Z', 'ADVICE', '하고 싶은 일과 해야 하는 일 사이에서 고민이에요\n안정적인 길을 가자니 마음이 무겁고, 하고 싶은 걸 하자니 불안해요.\n어떤 기준으로 정하면 좋을까요?'),
      concern('209', '2026-11-06T14:00:00Z', 'EXPERIENCE', '부모님께 속마음을 말하기가 어려워요\n걱정하실까 봐 늘 괜찮다고만 해요.'),
      concern('210', '2026-11-05T02:00:00Z', 'EMPATHY', '요즘 자주 눈물이 나요\n이유를 딱 집어 말할 수는 없는데 사소한 일에도 울컥해요.\n그냥 잠깐 쉬어도 되는 걸까요.'),
    ],
    island: { ownedItemIds: [] },
  }
}
