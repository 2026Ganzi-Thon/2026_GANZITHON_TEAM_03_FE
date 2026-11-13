# 감정 기록 API (EMOTION)

공통 규칙(인증, ID·날짜 형식, 응답 래퍼, 오류 형식)은 [common.md](./common.md) 참고. 모든 API는 로그인 사용자 전용이고 `Authorization: Bearer {accessToken}` 헤더가 필요하다. 개발 상황은 전부 "검토 필요"(초안).

## 공통 타입

```ts
type Emotion = {
  emotionId: string       // 양의 정수 ID (문자열)
  code: string            // 감정 코드 (예: JOY, CALM) - 실제 코드 목록은 기획 합의 필요
  name: string            // 표시 이름 (예: 기쁨)
  displayOrder: number    // 표시 순서
  active: boolean         // 현재 선택 가능한 감정인지
}

type EmotionRecord = {
  recordId: string
  recordDate: string      // YYYY-MM-DD (Asia/Seoul)
  memo: string | null     // 최대 1,000자 (제안)
  emotions: Emotion[]     // 비활성 감정도 기존 연결이 있으면 포함
  createdAt: string       // UTC ISO 8601
  updatedAt: string       // UTC ISO 8601
}
```

## 1. 감정 목록 조회

`GET /api/v1/emotions` · 200 · 요구사항 F-1, F-1-1

감정 입력 화면에서 선택할 활성 감정 목록을 표시 순서대로 조회한다.

- Request: 본문 없음, Query 없음
- Response `data.items: Emotion[]` (활성 감정만, `displayOrder` 오름차순 → `id` 오름차순, 없으면 `[]`)

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 조회 성공 |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / AUTH_ACCESS_TOKEN_EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

미결정: 실제 감정 코드·이름·순서·활성 목록은 기획 담당자와 확정.

## 2. 감정 기록 작성 및 먹이 주기

`POST /api/v1/emotion-records` · 201 · 요구사항 F-1-1

하나 이상의 감정과 선택 메모로 오늘의 비공개 기록을 만든다. 먹이 주기 애니메이션은 저장 성공 후 클라이언트에서 표시한다. 이 API는 양털을 지급하지 않는다.

Request body

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| emotionIds | string[] | 필수 | 서로 다른 활성 감정 ID 1개 이상. 중복·미등록·비활성 ID 거절 |
| memo | string \| null | 선택 | 최대 1,000자. 생략·null·공백뿐이면 null로 저장 |

`recordDate`는 body로 받지 않고 서버가 한국 날짜로 계산한다.

```json
{ "emotionIds": ["1", "2"], "memo": "산책하고 나니 조금 편안해졌다." }
```

Response `data: EmotionRecord`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 201 | - | 오늘의 기록 생성 |
| 400 | EMOTION_INVALID_SELECTION | 감정 미선택·중복·미등록·비활성 |
| 400 | COMMON_INVALID_REQUEST | 메모 길이·형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / AUTH_ACCESS_TOKEN_EXPIRED | 토큰 오류 / 만료 |
| 409 | EMOTION_RECORD_ALREADY_EXISTS | 오늘의 기록이 이미 존재 (하루 한 기록 제안) |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

미결정: 하루 기록 횟수, 과거 날짜 신규 작성 허용, 감정 강도 포함 여부, 메모 1,000자 제한.

## 3. 감정 기록 목록 조회

`GET /api/v1/emotion-records` · 200 · 요구사항 F-1-2

내 감정 기록만 날짜 범위로 조회한다. 캘린더와 지난 기록 목록에서 사용한다.

Query

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| from, to | date | 선택 | 둘 다 생략하면 한국 기준 이번 달 1일~오늘. 전달 시 둘 다 필요. `from <= to`, 최대 366일, 미래 날짜 제외 |
| page | integer | 선택 | 0 이상, 기본 0 |
| size | integer | 선택 | 1~100, 기본 20 |

예: `GET /api/v1/emotion-records?from=2026-11-01&to=2026-11-08&page=0&size=20`

Response (`recordDate` 내림차순 → `id` 내림차순, 결과 없어도 200 + `items: []`)

```ts
data: {
  items: EmotionRecord[]
  page: number      // 0부터
  size: number
  hasNext: boolean
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 조회 성공 |
| 400 | EMOTION_INVALID_DATE_RANGE | 날짜 조합·범위 오류 |
| 400 | COMMON_INVALID_REQUEST | 페이지 값 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / AUTH_ACCESS_TOKEN_EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 한 달 캘린더는 `size=100`으로 한 번에 요청 가능. page·size 방식과 상한은 화면 요구에 맞춰 확정 필요.

## 4. 감정 기록 상세 조회

`GET /api/v1/emotion-records/{recordId}` · 200 · 요구사항 F-1-2

- Path: `recordId` (본인 소유의 기록 ID)
- Response `data: EmotionRecord`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 조회 성공 |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / AUTH_ACCESS_TOKEN_EXPIRED | 토큰 오류 / 만료 |
| 404 | EMOTION_RECORD_NOT_FOUND | 없거나 내 소유가 아님 (타인 기록도 같은 404) |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

## 5. 감정 기록 수정

`PATCH /api/v1/emotion-records/{recordId}` · 200 · 요구사항 F-1-2

내 기록의 감정과 메모를 부분 수정한다. 과거 기록 수정은 허용하고 날짜는 바꾸지 않는다(초안).

Request body (생략한 필드는 유지)

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| emotionIds | string[] | 선택 | 전달 시 전체 감정 선택을 교체. 1개 이상, 중복·null 불가, `[]` 불가. 새로 추가하는 감정은 활성만 허용 (기존 연결된 비활성 감정 유지는 허용) |
| memo | string \| null | 선택 | 최대 1,000자. null 또는 공백뿐이면 메모 삭제 |

```json
{ "emotionIds": ["2"], "memo": null }
```

Response `data: EmotionRecord` (수정 후)

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 수정 성공 |
| 400 | COMMON_EMPTY_UPDATE | 수정할 필드가 하나도 없음 |
| 400 | EMOTION_INVALID_SELECTION | 감정 선택 오류 |
| 400 | COMMON_INVALID_REQUEST | 길이·타입·허용하지 않은 필드 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / AUTH_ACCESS_TOKEN_EXPIRED | 토큰 오류 / 만료 |
| 404 | EMOTION_RECORD_NOT_FOUND | 없거나 내 소유가 아님 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: `recordDate`, `userId`, `createdAt` 등 서버 관리 필드는 수정 불가. 동시 수정은 마지막 성공 변경이 적용된다(제안).

## 6. 감정 기록 삭제

`DELETE /api/v1/emotion-records/{recordId}` · 204 · 요구사항 F-1-2

내 기록 한 건을 실제 삭제한다(논리 삭제 아님, 제안). 확인창은 클라이언트에서 띄운다. 양털 지급이 없으므로 회수도 없다.

- Path: `recordId`
- Request/Response 본문 없음 (`data`도 반환하지 않음)

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 204 | - | 삭제 성공 |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / AUTH_ACCESS_TOKEN_EXPIRED | 토큰 오류 / 만료 |
| 404 | EMOTION_RECORD_NOT_FOUND | 없거나 내 소유가 아님 (이미 삭제한 ID도 동일) |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |
