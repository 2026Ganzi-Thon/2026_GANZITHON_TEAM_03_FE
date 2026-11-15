// TODO(API 연결): 양털 API(`GET /wool-wallet`, docs/api/care-wool.md)가 붙으면 이 파일을 지운다.
// 그 전까지 mock 들이 같은 양털 잔액을 보게 하는 임시 저장소다(모듈 메모리 — 새로고침하면 처음 값).
// 홈 요약(features/home)·섬 꾸미기(features/island)의 mock API 와 app/routes 의 임시 양털 값이 여기를 본다.
// 기능끼리는 서로 import 할 수 없어서(CLAUDE.md 규칙 2) 공용에 둔다.

// 임의 결정(확인 필요): 시작 잔액 47 은 시안 머리의 "내 양털 47개"
let balance = 47

/** 지금 쓸 수 있는 양털(mock) */
export function getMockWoolBalance(): number {
  return balance
}

/** 양털을 쓴다(mock). 모자라면 쓰지 않고 false 를 돌려준다 */
export function spendMockWool(amount: number): boolean {
  if (amount > balance) return false
  balance -= amount
  return true
}
