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

// TODO(API 클라이언트 연결): API 클라이언트(shared/api.ts)가 생기면 이 함수 한 곳만
// `GET /api/v1/home` 호출로 바꾼다. 지금은 docs/api/home.md 예시와 같은 mock 을 돌려준다.
export async function fetchHomeSummary(): Promise<HomeSummary> {
  // 임의 결정(확인 필요): mock 에 0.3초 지연을 줘서 로딩 상태를 볼 수 있게 함 — API 연결 시 함께 지운다
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    nickname: '온기',
    woolBalance: 12,
    today: '2026-11-08',
    todayEmotion: {
      recorded: false,
      recordId: null,
      emotions: [],
    },
    maturedConcernCount: 0,
  }
}
