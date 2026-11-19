# 자기 돌봄·양털 API (CARE, WOOL)

공통 규칙은 [common.md](./common.md) 참고. 로그인 사용자 전용, 개발 상황 "검토 필요"(초안), 요구사항 F-3.

## 개념

- **돌봄 행동**(예: 물 한 잔 마시기)을 오늘 완료하면 서버가 정한 **양털**을 적립한다. 보상량은 클라이언트가 정하지 않는다. 행동 이름·설명·보상값은 문서의 예시이고 기획에서 확정한다.
- 같은 날 같은 행동은 "현재 완료"가 하나만 유지된다. **당일에 한해 취소하면 양털을 회수**하고, 취소 후 다시 완료할 수 있다(초안).
- 양털 변동은 거래(`EARN` 적립, `REVERSE` 회수, `SPEND` 섬 꾸미기 구매)로 쌓고, 과거 거래는 지우거나 수정하지 않는다.
- 체크박스는 행 존재 여부가 아니라 **`isCompleted`** 로 표시한다.

```ts
type CareCompletion = {
  completionId: string
  careActionId: string
  actionDate: string            // YYYY-MM-DD (Asia/Seoul)
  rewardAmount: number          // 지급 당시 서버 기준 지급량, 0 이상
  isCompleted: boolean          // 취소 상태는 false
  completedAt: string
  cancelledAt: string | null
  earningTransactionId: string | null   // 현재 완료 회차의 적립 거래, 취소 상태는 null
}
```

화면 흐름: 진입 시 `돌봄 행동 목록 조회` + `오늘의 돌봄 완료 내역 조회`를 합쳐서 체크 상태를 그린다 → 체크하면 `돌봄 행동 완료`, 체크 해제하면 `돌봄 행동 완료 취소`.

## Idempotency-Key (이 도메인의 쓰기 API 2개)

`돌봄 행동 완료`와 `돌봄 행동 완료 취소`는 **`Idempotency-Key: {UUID}` 헤더가 필수**다(제안).

- 같은 사용자 동작을 재전송할 때는 같은 키, 새 동작은 새 UUID.
- 같은 키·같은 요청의 재시도는 최초 성공 응답을 그대로 돌려주고 추가 적립하지 않는다. 같은 키로 다른 요청을 보내거나 아직 처리 중이면 `409 COMMON_IDEMPOTENCY_CONFLICT`.
- 재시도 응답은 최초 성공 시점의 스냅샷이므로, 동작 후에는 잔액·내역을 다시 조회한다.
- 보관 기간 24시간(제안). 적용 여부는 백엔드와 합의 전.

## 1. 돌봄 행동 목록 조회

`GET /api/v1/care-actions` · 200

오늘 실천할 수 있는 활성 돌봄 행동과 현재 보상량을 조회한다. 체크 여부는 포함하지 않으므로 "오늘의 돌봄 완료 내역 조회"와 합친다.

Response `data.items` (`active=true`, `displayOrder` 오름차순 → `id` 오름차순, 없으면 `[]`)

| 필드 | 타입 | NULL | 설명 |
| --- | --- | --- | --- |
| careActionId | string | N | |
| name | string | N | 예: 물 한 잔 마시기 |
| category | string | N | 분류(탭) — `움직이기`·`마음돌봄`·`쉬어가기`·`일상가꾸기`, 그 밖의 행동은 `기타`(V13 기본값). 2026-11-20 추가 |
| description | string \| null | Y | 예: 지금 물을 한 잔 마셔보세요. V14 기본 행동은 null |
| rewardAmount | integer | N | 현재 지급량, 0 이상 |
| displayOrder | integer | N | 표시 순서 |

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공. 활성 행동이 없으면 `[]` |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

### 기본 데이터(V14, 백엔드 `docs/care-catalog.md`)

없는 행동만 보상 양털 4개·활성으로 넣는다(이름이 같은 기존 행동은 ID·보상·순서·활성 그대로, 분류가 `기타`면 분류만 채움).

| displayOrder | category | name |
| --- | --- | --- |
| 1~4 | 움직이기 | 물 한 잔 마시기 · 간단한 간식 먹기 · 10분 산책하기 · 편안한 옷으로 갈아입기 |
| 5~8 | 마음돌봄 | 양 먹이주기: 오늘의 마음을 한 줄로 적기 · 오늘 내가 애쓴 일 하나 알아주기 · 내 기분을 색이나 낙서로 표현하기 · 편한 사람에게 내 기분 이야기하기 |
| 9~12 | 쉬어가기 | 동굴 5분 닫기: 휴대폰을 5분 뒤집어보세요 · 불필요한 알림 잠시 끄기 · 좋아하는 음악 한 곡 듣기 · 따뜻한 음료 천천히 마시기 |
| 13~16 | 일상가꾸기 | 침구 정리하기 · 책상 위 물건 정리하기 · 사용한 컵 하나 씻기 · 마음에 드는 순간 사진으로 남기기 |

프론트는 `category`를 그대로 탭으로 쓴다(`features/care/careCategories.ts`). 기본 4개 탭은 늘 보이고, 그 밖의 분류는 뒤에(`기타`는 맨 뒤).

## 2. 오늘의 돌봄 완료 내역 조회

`GET /api/v1/care-completions/today` · 200

한국 날짜 기준 오늘의 내 완료 상태를 조회해 체크 표시를 복원한다.

Response `data`

```ts
{
  actionDate: string            // 서버가 계산한 오늘
  items: CareCompletion[]       // 오늘 생성된 완료 행. 취소된 행도 포함
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공. 내역이 없으면 `items: []` |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 행동이 비활성화돼도 이미 완료한 내역은 조회되며 당일 취소 정책도 같다.

## 3. 돌봄 행동 완료

`POST /api/v1/care-actions/{careActionId}/completions` · 200 (취소 후 재완료도 200)

오늘의 돌봄 행동을 완료하고 서버가 정한 양털을 적립한다.

| 필드 | 위치 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- | --- |
| careActionId | Path | ID | 필수 | 현재 활성 행동 |
| Idempotency-Key | Header | UUID | 필수 | 위 설명 참고 |

본문 없음. 예: `POST /api/v1/care-actions/1/completions` + `Idempotency-Key: 9c1a7440-2961-42a5-a88c-b7b142b79598`

Response `data`

```ts
{
  completion: CareCompletion
  balance: number        // 반영 직후 지갑 잔액
}
```

```json
{
  "data": {
    "completion": {
      "completionId": "201", "careActionId": "1", "actionDate": "2026-11-08",
      "rewardAmount": 10, "isCompleted": true, "completedAt": "2026-11-08T03:05:00Z",
      "cancelledAt": null, "earningTransactionId": "301"
    },
    "balance": 10
  }
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 완료·적립 성공 |
| 400 | COMMON_INVALID_REQUEST | 경로·요청 키 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 404 | CARE_ACTION_NOT_FOUND | 등록되지 않은 행동 |
| 409 | CARE_ACTION_INACTIVE | 새 완료가 불가능한 비활성 행동 |
| 409 | CARE_ALREADY_COMPLETED | 현재 이미 완료 상태 (다른 키로 요청) |
| 409 | COMMON_IDEMPOTENCY_CONFLICT | 같은 키로 다른 요청 또는 처리 중 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 응답의 `earningTransactionId`는 나중에 취소할 때 쓰므로 상태에 들고 있거나 "오늘 내역"에서 다시 얻는다.

## 4. 돌봄 행동 완료 취소

`POST /api/v1/care-completions/{completionId}/cancel` · 200

오늘의 내 완료를 취소하고 그 회차에 지급된 양털을 회수한다. 완료 취소, 반대 부호의 `REVERSE` 거래, 지갑 차감을 한 트랜잭션으로 처리한다.

| 필드 | 위치 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- | --- |
| completionId | Path | ID | 필수 | 본인 소유 완료 행 |
| Idempotency-Key | Header | UUID | 필수 | |
| earningTransactionId | Body | ID | 필수 | 취소할 **현재 완료 회차**의 적립 거래 ID (완료 응답 또는 오늘 내역에서 획득) |

```json
{ "earningTransactionId": "301" }
```

Response `data`

```ts
{
  completion: CareCompletion     // isCompleted: false, cancelledAt 채워짐, earningTransactionId: null
  reversalTransactionId: string  // 회수 거래 ID
  balance: number                // 취소 후 잔액
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 취소·회수 성공 |
| 400 | COMMON_INVALID_REQUEST | ID·요청 키·본문 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 404 | CARE_COMPLETION_NOT_FOUND | 내 완료가 아니거나 없음 |
| 409 | CARE_CANCEL_DATE_EXPIRED | 한국 날짜 기준 당일 완료가 아님 |
| 409 | CARE_ALREADY_CANCELLED | 이미 취소됨 (같은 키 재시도는 기존 성공 응답) |
| 409 | CARE_COMPLETION_CYCLE_CHANGED | 지정한 거래가 현재 회차가 아님 (재완료 후 늦은 취소 방지) |
| 409 | WOOL_BALANCE_INSUFFICIENT | 회수할 양털보다 잔액이 적음 (전체 취소 거절, 음수 지갑 불허) |
| 409 | COMMON_IDEMPOTENCY_CONFLICT | 키 충돌·처리 중 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 보상량이 바뀌었더라도 원래 지급한 `amount`만큼 회수한다. 비활성 행동의 당일 완료도 취소할 수 있다.

## 5. 양털 잔액 조회

`GET /api/v1/wool-wallet` · 200 · 요구사항 F-3, HOME-01

사용 가능한 내 양털 잔액을 조회한다. 지갑이 없으면 `balance: 0`, `updatedAt: null`을 돌려주고 GET에서 지갑을 만들지 않는다. 잔액을 직접 수정하는 API는 없다.

Response `data`

| 필드 | 타입 | NULL | 설명 |
| --- | --- | --- | --- |
| balance | integer | N | 현재 사용 가능한 양털, 0 이상 |
| updatedAt | string \| null | Y | UTC ISO 8601. 지갑 미생성이면 null |

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: "잔액"과 "누적 획득량"은 다르다. 홈의 "누적 양털" 표시 의미와 구매·선물 범위는 합의 전이다.

## 6. 양털 변동 내역 조회

`GET /api/v1/wool-transactions?page=0&size=20` · 200

내 양털 증감 이력을 최신순으로 조회한다. **백엔드 `CareService.transactions` 기준(2026-11-19 대조)** — 아래 형식과 같다. 백엔드가 만드는 종류는 돌봄 완료 적립 `EARN`(+), 완료 취소 회수 `REVERSE`(−), 섬 꾸미기 구매 `SPEND`(−, 2026-11-20 추가 — [island.md](./island.md))다. 행동 이름·산 아이템·거래 후 잔액은 응답에 없다.

| 필드 | 위치 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- | --- |
| page | Query | integer | 선택 | 0 이상, 기본 0 |
| size | Query | integer | 선택 | 1~100, 기본 20 |

Response `data` (`createdAt` 내림차순 → `id` 내림차순)

```ts
{
  items: {
    transactionId: string
    amount: number                       // EARN 양수, REVERSE·SPEND 음수
    transactionType: 'EARN' | 'REVERSE' | 'SPEND'
    careCompletionId: string | null      // SPEND 는 null
    reversesTransactionId: string | null // 회수 대상 원거래, EARN·SPEND는 null
    createdAt: string
  }[]
  page: number      // 0부터
  size: number
  hasNext: boolean
}
```

```json
{
  "data": {
    "items": [
      { "transactionId": "302", "amount": -10, "transactionType": "REVERSE", "careCompletionId": "201", "reversesTransactionId": "301", "createdAt": "2026-11-08T03:10:00Z" },
      { "transactionId": "301", "amount": 10, "transactionType": "EARN", "careCompletionId": "201", "reversesTransactionId": null, "createdAt": "2026-11-08T03:05:00Z" }
    ],
    "page": 0, "size": 20, "hasNext": false
  }
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공. 이력이 없으면 `items: []` |
| 400 | COMMON_INVALID_REQUEST | 페이지 값 오류(page < 0, size 1~100 밖, 숫자 아님) |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 현재 잔액을 과거 거래의 잔액처럼 표시하지 않는다. offset 방식이라 페이지 사이에 새 거래가 생기면 다음 페이지에 같은 거래가 다시 올 수 있다(프론트는 transactionId 로 중복 제거). 프론트: 양털 모으기의 "내 양털" 알약 → `/wool/history`, 날짜별·무한 스크롤(size 20). 섬 꾸미기 구매는 "섬 꾸미기 구매"로 보여준다(산 아이템은 응답에 없음).

## 미결정 사항 (이 도메인)

- 행동별 보상량, 당일 취소·재완료 허용, 재완료 시 보상 변경, 취소 가능 기간
- 이미 소비한 양털 때문에 잔액이 부족할 때 취소를 거절하는 안 (소비 기능 담당자와 합의)
- 홈의 "누적 양털" vs 사용 가능 잔액
- Idempotency-Key 적용 여부와 보관 정책
