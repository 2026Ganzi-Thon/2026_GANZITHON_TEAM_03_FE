import { mockDb, mockDelay, mockToday } from '@/shared/mock'

/** `docs/api/home.md` 의 `GET /api/v1/home` 응답 `data` 와 같은 모양. */
export interface HomeEmotion {
  emotionId: string
  code: string
  name: string
}

export interface HomeSummary {
  /** 초기 설정 전이면 null */
  nickname: string | null
  /** 현재 사용 가능한 양털. 홈의 "내 양털"과 같은 값 */
  woolBalance: number
  /** 서버 기준 오늘 날짜 `YYYY-MM-DD` */
  today: string
  todayEmotion: {
    recorded: boolean
    recordId: string | null
    emotions: HomeEmotion[]
  }
  /** 숙성이 끝났지만 아직 개봉하지 않은 내 고민 수 */
  maturedConcernCount: number
}

// TODO(API 연결): 이 함수 본문만 `return api.get<HomeSummary>('/home')` 로 바꾸고 `@/shared/mock` import 를 지운다.
// 지금은 가짜 DB(`@/shared/mock`)에서 계산한다 — 닉네임·양털·감정 기록이 다른 화면과 같은 값이다.
export async function fetchHomeSummary(): Promise<HomeSummary> {
  await mockDelay()

  const today = mockToday()
  const record = mockDb.emotion.findByDate(today)
  return {
    nickname: mockDb.user.get().nickname,
    woolBalance: mockDb.wool.balance().balance,
    today,
    todayEmotion: {
      recorded: Boolean(record),
      recordId: record?.recordId ?? null,
      emotions: record?.emotions.map(({ emotionId, code, name }) => ({ emotionId, code, name })) ?? [],
    },
    // 숙성 치즈는 아직 기능이 없다
    maturedConcernCount: 0,
  }
}
