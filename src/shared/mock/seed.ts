import { getTodaySeoul } from '@/shared/lib/formatRelativeDate'
import type { ComfortType, Emotion, Id, IsoDateTime, Reply, RestSession } from '@/shared/types'

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

/**
 * 내가 쓴 고민 한 행. 위의 `concerns`(다른 사람이 쓴 고민, 위로할 목록)와 따로 둔다.
 * 상태(숙성 중·숙성 끝·개봉·보관)는 저장하지 않고 시각으로 계산한다(docs/api/cheese.md "개념") — features/cheese/cheeseApi.ts 가 흉내 낸다.
 */
export interface MockMyConcernRow {
  concernId: Id
  content: string
  comfortType: ComfortType
  createdAt: IsoDateTime
  maturesAt: IsoDateTime
  /** 개봉 전이면 null */
  openedAt: IsoDateTime | null
  /** 보관 전이면 null */
  savedAt: IsoDateTime | null
  /** 다른 사람들이 남긴 위로(작성 시각 오름차순). 개봉 전에는 응답에 나가지 않는다 */
  replies: Reply[]
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
  /** 내가 쓴 고민(최신이 앞) */
  myConcerns: MockMyConcernRow[]
  /** 섬 꾸미기에서 산 아이템 ID. 아이템 목록 자체는 features/island/islandApi.ts 상수 */
  island: { ownedItemIds: string[] }
  /**
   * 휴식 세션(최근 것이 앞). DB 에 저장된 그대로의 행이라 예정 종료를 지난 `RUNNING` 이 남아 있을 수 있다 —
   * 응답에서 `COMPLETED` 로 계산하는 규칙은 features/rest/restApi.ts 가 흉내 낸다(서버 몫).
   */
  restSessions: RestSession[]
  nextRestSessionId: number
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

/** 지금에서 `hours` 시간 뒤(음수면 전) ISO 시각. 시드를 처음 만들 때 한 번만 계산해 절대 시각으로 저장한다. */
function hoursFromNow(hours: number): IsoDateTime {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

// 임의 결정(확인 필요): 시드의 숙성 시간은 24시간 — 명세 미결정(docs/api/cheese.md 1번)
const MATURE_HOURS = 24

/** 내가 쓴 고민 시드: 쓴 지 `ageHours` 시간 전, 개봉·보관은 쓴 뒤 몇 시간 뒤인지(없으면 null) */
function myConcern(
  concernId: string,
  ageHours: number,
  comfortType: ComfortType,
  content: string,
  {
    openedAfter = null,
    savedAfter = null,
    replies = [],
  }: { openedAfter?: number | null; savedAfter?: number | null; replies?: string[] } = {},
): MockMyConcernRow {
  const at = (afterHours: number | null) => (afterHours === null ? null : hoursFromNow(afterHours - ageHours))
  return {
    concernId,
    content,
    comfortType,
    createdAt: hoursFromNow(-ageHours),
    maturesAt: hoursFromNow(MATURE_HOURS - ageHours),
    openedAt: at(openedAfter),
    savedAt: at(savedAfter),
    // 위로는 쓴 뒤 숙성 시간 안에 고르게 남았다고 본다(오래된 것이 앞)
    replies: replies.map((reply, index) => ({
      replyId: `${concernId}-${index + 1}`,
      content: reply,
      fromSystem: false,
      createdAt: hoursFromNow(Math.min(((index + 1) * MATURE_HOURS) / (replies.length + 1), ageHours) - ageHours),
    })),
  }
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
    // 숙성 중·숙성 끝·개봉·보관이 섞이게. 본문 첫 줄이 제목, 일부는 본문이 짧아 "더보기"가 없다
    myConcerns: [
      myConcern('301', 2, 'EMPATHY', '발표를 망친 것 같아 계속 마음에 걸려요\n준비를 오래 했는데 막상 앞에 서니 머릿속이 하얘졌어요.\n다들 괜찮았다고 하는데 저만 자꾸 그 장면을 다시 떠올리게 돼요.\n다음 발표가 벌써부터 무서워요.', { replies: ['저도 발표 때 머리가 하얘진 적이 있어요. 그만큼 잘하고 싶었던 거예요.'] }),
      myConcern('302', 9, 'ADVICE', '이사를 갈지 말지 고민이에요\n회사와 가까운 곳으로 가면 출퇴근이 편해지지만 월세가 꽤 올라요.\n지금 동네에 정이 많이 들기도 했고요. 어떤 걸 더 중요하게 봐야 할까요?', { replies: ['출퇴근 시간이 줄면 하루가 정말 달라지더라고요.', '정든 동네라면 조금 더 지내 보면서 천천히 정해도 괜찮아요.'] }),
      myConcern('303', 30, 'EXPERIENCE', '새로운 취미를 찾고 싶어요\n퇴근하면 휴대폰만 보다가 잠들어요.', { replies: ['산책이나 그림 그리기처럼 작게 시작할 수 있는 걸 추천해요.'] }),
      myConcern('304', 52, 'EMPATHY', '동생과 크게 다퉜어요\n별일 아닌 걸로 시작했는데 서로 날 선 말을 주고받았어요.\n먼저 사과하고 싶은데 어떻게 말을 꺼내야 할지 모르겠어요.\n시간이 지날수록 더 어색해지는 것 같아요.', { openedAfter: 30, replies: ['먼저 사과하고 싶다는 마음이 벌써 큰 용기예요.', '"그때 내가 말이 심했어" 한마디면 충분할 때가 많더라고요.', '저도 동생이랑 그런 적 있는데, 밥 한 끼 같이 먹으면서 풀렸어요.'] }),
      myConcern('305', 75, 'ADVICE', '공부 계획을 세워도 지키지 못해요\n매일 아침 계획표를 새로 쓰는데 저녁이 되면 절반도 못 했어요.\n계획을 줄여야 할지, 제가 의지가 약한 건지 모르겠어요.', { openedAfter: 26, savedAfter: 27, replies: ['계획을 절반으로 줄여 보세요. 다 해낸 날이 늘면 자신감도 붙어요.', '의지가 약한 게 아니라 계획이 너무 많았던 걸 수도 있어요.'] }),
      myConcern('306', 98, 'EXPERIENCE', '첫 자취를 앞두고 설레면서도 걱정돼요\n요리도 청소도 다 혼자 해야 한다니 막막해요.\n먼저 자취해 본 분들은 처음에 뭐가 제일 힘들었나요?', { openedAfter: 40, replies: ['처음엔 밥 챙겨 먹는 게 제일 힘들었어요. 간단한 반찬 몇 개만 익혀 두면 훨씬 편해요.'] }),
      myConcern('307', 130, 'EMPATHY', '요즘 잠을 잘 못 자요'),
      myConcern('308', 170, 'EMPATHY', '좋아하던 일이 점점 버거워져요\n처음엔 정말 즐거워서 시작한 일인데 요즘은 아침마다 출근이 두려워요.\n쉬고 싶다는 말을 꺼내면 다들 실망할 것 같아서 아무 말도 못 하고 있어요.\n이 마음을 어떻게 다뤄야 할지 모르겠어요.', { openedAfter: 30, savedAfter: 31, replies: ['좋아하던 일이 버거워지는 건 그만큼 오래 애썼다는 뜻이에요.', '쉬고 싶다는 말은 실망시키는 말이 아니라 오래 가고 싶다는 말이에요.', '잠깐 멈추는 것도 일을 사랑하는 방법이라고 생각해요.'] }),
      myConcern('309', 220, 'ADVICE', '돈 관리를 제대로 해 보고 싶어요\n월급날이 지나면 어디에 썼는지 모르게 금방 비어요.\n가계부를 써 봤는데 일주일을 못 갔어요.', { openedAfter: 50, replies: ['가계부 대신 일주일에 한 번 통장만 확인해 보는 것부터 시작해 보세요.'] }),
    ],
    island: { ownedItemIds: [] },
    restSessions: [],
    nextRestSessionId: 401,
  }
}
