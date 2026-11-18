// 가짜 DB — 실제 API 가 붙기 전까지 서버 DB 역할을 한다. 자세한 규칙은 README.md.
// import 는 기능의 *Api.ts(와 shared/wool/woolApi.ts)만 한다. 예외: app/ 의 `?reset` 처리(resetMockDb).
// API 를 붙일 때 *Api.ts 본문을 호출로 바꾸면 이 폴더는 통째로 지울 수 있다.
export { mockDb, mockDelay, mockToday, resetMockDb, WOOL_BALANCE_INSUFFICIENT } from './mockDb'
export type { MockConcernRow, MockDbState, MockEmotionRecordRow, MockMyConcernRow } from './seed'
