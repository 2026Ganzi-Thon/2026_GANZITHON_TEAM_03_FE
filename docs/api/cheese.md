# 고민·위로(치즈) API (CONCERN, REPLY)

공통 규칙은 [common.md](./common.md) 참고. 모든 API는 로그인 사용자 전용이고 `Authorization: Bearer {accessToken}`이 필요하다. 개발 상황은 전부 "검토 필요"(초안), 요구사항은 F-2.

## 개념

- 고민을 쓰면 **숙성**이 시작되고, 숙성이 끝나면 작성자가 **치즈를 개봉**해서 다른 사용자가 남긴 위로를 본다. 개봉한 치즈는 **보관함**에 넣을 수 있다.
- 다른 사용자의 숙성 중 고민에는 **위로 답장**을 남길 수 있다(고민당 1회, 자기 고민 불가). 익명이라 응답에 작성자 정보(userId, 닉네임)는 없다.
- 상태는 DB에 저장하지 않고 시각(`maturesAt`, `openedAt`, `savedAt`)으로 서버가 계산한다.

```ts
type ConcernStatus = 'MATURING' | 'MATURED' | 'OPENED' | 'SAVED'
// MATURING 숙성 중 / MATURED 숙성 끝, 아직 안 엶 / OPENED 개봉함 / SAVED 보관함

type ComfortType = 'EMPATHY' | 'EXPERIENCE' | 'ADVICE'
// 공감이 필요해요 / 경험을 듣고 싶어요 / 조언도 괜찮아요

type Reply = {
  replyId: string
  content: string
  fromSystem: boolean   // 기본 위로(시스템 문구) 여부
  createdAt: string
}
```

화면 흐름과 API 대응

| 화면 | API |
| --- | --- |
| 위로할 고민 목록 | 위로할 고민 목록 조회 → (카드 선택) 고민 상세 조회 → 위로 답장 작성 |
| 내 치즈 목록 | 내 치즈 목록 조회 → 치즈 개봉 → (선택) 치즈 보관 |
| 치즈 보관함 | 치즈 보관함 목록 조회 → 받은 위로 목록 조회 |
| 고민 쓰기 | 고민 작성 및 숙성 시작 |

## 1. 고민 작성 및 숙성 시작

`POST /api/v1/concerns` · 201

Header: `Authorization`, **`Idempotency-Key: {UUID}`** (필수, 제안). 같은 작성 동작을 재전송할 때는 같은 키, 새 작성은 새 키.

| 필드 | 위치 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- | --- |
| content | Body | string | 필수 | 앞뒤 공백 제거 후 1자 이상. 최대 길이 미정 |
| comfortType | Body | ComfortType | 필수 | EMPATHY / EXPERIENCE / ADVICE |

```json
{ "content": "취업 준비가 길어지니 자꾸 비교하게 돼요", "comfortType": "EMPATHY" }
```

Response `data`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| concernId | string | |
| status | `"MATURING"` | 항상 MATURING |
| maturesAt | string | 숙성 종료 시각 (서버가 작성 시점에 결정) |
| createdAt | string | |

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 201 | - | 생성 및 숙성 시작 |
| 400 | COMMON_INVALID_REQUEST | 본문 누락·공백·길이 초과, 정의되지 않은 위로 방식, 키 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 409 | COMMON_IDEMPOTENCY_CONFLICT | 같은 키로 다른 요청, 또는 아직 처리 중 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

미결정: 숙성 시간, 본문 최대 길이, 욕설·비방 검열, 동시 숙성 개수 제한, Idempotency-Key 적용 여부. 공개 안내(C02-1)와 연타 방지는 클라이언트가 처리한다.

## 2. 위로할 고민 목록 조회

`GET /api/v1/concerns` · 200

위로를 남길 수 있는 **다른 사용자의 숙성 중 고민**을 무작위로 최대 100개 조회한다. 목록 진입 시 한 번만 호출하고 스크롤은 받은 데이터 안에서 처리한다(확정). 상세에서 돌아올 때는 재호출하지 않고 목록·순서·스크롤 위치를 유지한다.

- Request: 본문·Query 없음
- 적격 조건: 본인 고민 아님, 숙성 중(위로 접수 중), 내가 아직 위로를 남기지 않음

Response `data`

```ts
{
  items: {
    concernId: string
    preview: string        // 본문 앞부분 (길이 미정)
    comfortType: ComfortType
    createdAt: string
  }[]
  count: number            // 이번 응답에 포함된 개수 (전체 수 아님)
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공. 적격 고민이 없어도 200 + 빈 배열 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

미결정: 같은 지역 사용자에게만 노출할지, preview 길이, 새로고침을 새 목록으로 볼지.

## 3. 고민 상세 조회

`GET /api/v1/concerns/{concernId}` · 200

고민 본문과 상태를 조회한다. 받은 위로는 포함하지 않는다. 남은 시간은 `maturesAt`으로 화면에서 계산한다.

Response `data`

| 필드 | 타입 | NULL | 설명 |
| --- | --- | --- | --- |
| concernId | string | N | |
| content | string | N | 고민 전체 본문 |
| comfortType | ComfortType | N | |
| createdAt | string | N | |
| mine | boolean | N | 내 고민 여부 |
| status | ConcernStatus | N | |
| maturesAt | string \| null | Y | **내 고민일 때만** 값, 타인에게는 null |
| replyable | boolean | N | 지금 내가 위로를 남길 수 있는지 (내 고민이면 false) |
| alreadyReplied | boolean | N | 내가 이미 위로를 남겼는지 (내 고민이면 false) |

```json
{
  "data": {
    "concernId": "105", "content": "취업 준비가 길어지니 자꾸 비교하게 돼요",
    "comfortType": "EMPATHY", "createdAt": "2026-11-08T01:00:00Z",
    "mine": false, "status": "MATURING", "maturesAt": null,
    "replyable": true, "alreadyReplied": false
  }
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 |
| 400 | COMMON_INVALID_REQUEST | 경로 ID 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 404 | CONCERN_NOT_FOUND | 고민이 없거나 삭제됨 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: GET이라 개봉 처리는 하지 않는다. 목록에서 받은 뒤 삭제되거나 숙성이 끝났을 수 있어 상세에서 다시 확인한다. 미결정: 다른 사용자에게 위로 목록을 공개할지(기능명세서 C03-2와 F-2 설명이 다름, 현재는 F-2 기준), 숙성이 끝난 타인 고민을 계속 보여줄지.

## 4. 위로 답장 작성

`POST /api/v1/concerns/{concernId}/replies` · 201

다른 사용자의 숙성 중 고민에 위로를 남긴다. 고민당 1회, 자기 고민 불가.

| 필드 | 위치 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- | --- |
| concernId | Path | ID | 필수 | |
| content | Body | string | 필수 | 앞뒤 공백 제거 후 1자 이상. 최대 길이 미정 |

```json
{ "content": "저도 같은 시기를 지나왔어요. 비교가 멈추는 날이 와요." }
```

Response `data`: `{ replyId: string, concernId: string, createdAt: string }`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 201 | - | 작성 성공 |
| 400 | COMMON_INVALID_REQUEST | 본문 누락·공백·길이 초과, 경로 ID 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 403 | REPLY_OWN_CONCERN_FORBIDDEN | 자기 고민에 작성 |
| 404 | CONCERN_NOT_FOUND | 고민이 없거나 삭제됨 |
| 409 | REPLY_ALREADY_EXISTS | 이미 이 고민에 위로를 남김 |
| 409 | CONCERN_REPLY_CLOSED | 숙성이 끝나 접수 마감 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: Idempotency-Key는 쓰지 않는다. 재전송으로 409를 받으면 프론트는 작성 완료로 처리해도 된다. 미결정: 최대 길이, 검열, **내가 남긴 위로 삭제 API**(`DELETE /api/v1/replies/{replyId}`)를 추가할지. 현재 명세에 없다.

## 5. 내 치즈 목록 및 숙성 상태 조회

`GET /api/v1/users/me/concerns?page=0&size=20` · 200

내가 쓴 고민을 숙성 상태와 함께 최신순으로 조회한다. 숙성이 끝난 치즈를 찾아 개봉하는 진입점이다.

| 필드 | 위치 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- | --- |
| page | Query | integer | 선택 | 0 이상, 기본 0 (제안) |
| size | Query | integer | 선택 | 1~50, 기본 20 (제안) |

Response `data`

```ts
{
  items: {
    concernId: string
    preview: string
    comfortType: ComfortType
    status: ConcernStatus
    maturesAt: string
    openedAt: string | null   // 개봉 전이면 null
    createdAt: string
  }[]
  page: number
  size: number
  hasNext: boolean
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공. 없으면 빈 배열 |
| 400 | COMMON_INVALID_REQUEST | page·size 범위 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 개봉 전에 결과를 알 수 없도록 위로 개수는 응답에 넣지 않는다. 숙성 중 남은 시간은 `maturesAt`으로 화면에서 계산한다. 미결정: 보관한 치즈(SAVED)도 이 목록에 보여줄지, 페이지·커서 방식.

## 6. 치즈 개봉

`POST /api/v1/concerns/{concernId}/open` · 200

숙성이 끝난 **내** 고민을 개봉하고 받은 위로를 반환한다. 위로가 하나도 없으면 기본 위로 하나를 넣은 뒤 반환한다. 이미 개봉했으면 `openedAt`을 바꾸지 않고 현재 위로 목록을 돌려준다(처음·반복 모두 200).

- Request: Path `concernId` (본인 고민만), 본문 없음
- 숙성 중이면 개봉 버튼을 비활성화하고, 개봉 연출은 성공 응답 이후 화면에서 처리한다.

Response `data`

```ts
{
  concernId: string
  status: 'OPENED' | 'SAVED'
  openedAt: string        // 최초 개봉 시각
  replies: Reply[]        // 1개 이상, 작성 시각 오름차순
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 개봉 성공 또는 이미 개봉됨 |
| 400 | COMMON_INVALID_REQUEST | 경로 ID 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 404 | CONCERN_NOT_FOUND | 고민이 없거나 내 고민이 아님 |
| 409 | CONCERN_NOT_MATURED | 아직 숙성 중 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

미결정: 기본 위로 문구 목록, 위로가 1개 이상이어도 기본 위로를 함께 줄지.

## 7. 받은 위로 목록 조회

`GET /api/v1/concerns/{concernId}/replies` · 200

개봉한 **내** 치즈의 위로를 다시 조회한다(보관함에서 열어볼 때). 처음 개봉은 "치즈 개봉" API로 한다. 개봉 전이면 409.

Response `data`: "치즈 개봉"과 같은 형식 `{ concernId, status: 'OPENED' | 'SAVED', openedAt, replies: Reply[] }` (작성 시각 오름차순). `fromSystem`이 true인 위로는 기본 위로로 구분해 표시할 수 있다.

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 |
| 400 | COMMON_INVALID_REQUEST | 경로 ID 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 404 | CONCERN_NOT_FOUND | 고민이 없거나 내 고민이 아님 |
| 409 | CONCERN_NOT_OPENED | 아직 개봉하지 않음. 먼저 "치즈 개봉" 호출 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

미결정: 위로가 많아질 때 페이지네이션 필요 여부.

## 8. 치즈 보관

`PATCH /api/v1/concerns/{concernId}/save` · 200

개봉한 내 치즈를 보관함에 넣는다. 이미 보관했으면 `savedAt`을 바꾸지 않고 200. 개봉 전 치즈에는 보관 버튼을 보이지 않는다.

- Request: Path `concernId`, 본문 없음
- Response `data`: `{ concernId: string, status: 'SAVED', savedAt: string }`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 보관 성공 또는 이미 보관됨 |
| 400 | COMMON_INVALID_REQUEST | 경로 ID 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 404 | CONCERN_NOT_FOUND | 고민이 없거나 내 고민이 아님 |
| 409 | CONCERN_NOT_OPENED | 개봉하지 않은 고민 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

미결정: 보관함 개수 상한.

## 9. 치즈 보관 취소

`PATCH /api/v1/concerns/{concernId}/unsave` · 200

보관함에서 치즈를 뺀다. 고민과 위로는 지우지 않고 개봉(OPENED) 상태로 돌아간다. 이미 보관 상태가 아니어도 200. 완전히 지우려면 "고민 및 치즈 삭제"를 쓴다. 화면 문구로 보관 취소와 삭제를 구분해 안내한다.

- Request: Path `concernId`, 본문 없음
- Response `data`: `{ concernId: string, status: 'OPENED', savedAt: null }`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 보관 취소 성공 또는 이미 보관되지 않은 상태 |
| 400 | COMMON_INVALID_REQUEST | 경로 ID 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 404 | CONCERN_NOT_FOUND | 고민이 없거나 내 고민이 아님 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

## 10. 치즈 보관함 목록 조회

`GET /api/v1/users/me/saved-concerns?page=0&size=20` · 200 · 요구사항 F-2, HOME-01

보관한 내 치즈를 보관 시각 최신순으로 조회한다. 위로 내용은 "받은 위로 목록 조회"로 열어본다. 홈의 보관함 진입에서 쓴다.

| 필드 | 위치 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- | --- |
| page | Query | integer | 선택 | 0 이상, 기본 0 (제안) |
| size | Query | integer | 선택 | 1~50, 기본 20 (제안) |

Response `data`

```ts
{
  items: {
    concernId: string
    preview: string
    comfortType: ComfortType
    replyCount: number     // 받은 위로 수 (기본 위로 포함)
    savedAt: string
  }[]
  page: number
  size: number
  hasNext: boolean
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공. 없으면 빈 배열 |
| 400 | COMMON_INVALID_REQUEST | page·size 범위 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

## 11. 고민 및 치즈 삭제

`DELETE /api/v1/concerns/{concernId}` · 204

**내** 고민을 삭제한다. 숙성 중·개봉·보관 상태 모두 같은 API이고 달린 위로도 함께 삭제된다. 확인창을 띄우고, 다른 사용자가 남긴 위로도 함께 사라진다고 안내한다. 숙성 중 삭제된 뒤 다른 사용자가 위로를 보내면 "위로 답장 작성"에서 404를 받는다.

- Request: Path `concernId` (본인 고민만), 본문 없음
- Response: 본문 없음 (`data`도 없음)

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 204 | - | 삭제 성공 |
| 400 | COMMON_INVALID_REQUEST | 경로 ID 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 404 | CONCERN_NOT_FOUND | 없거나 내 고민이 아님 (이미 삭제된 경우 포함, 타인 고민도 404로 존재를 숨김) |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

미결정: 실제 삭제 vs 숨김 처리(현재 ERD는 실제 삭제).

## 이 도메인 전용 오류 코드 요약

| 코드 | HTTP | 발생 API |
| --- | --- | --- |
| CONCERN_NOT_FOUND | 404 | 상세·위로 작성·개봉·위로 조회·보관·보관 취소·삭제 |
| CONCERN_NOT_MATURED | 409 | 개봉 |
| CONCERN_NOT_OPENED | 409 | 위로 조회·보관 |
| CONCERN_REPLY_CLOSED | 409 | 위로 작성 |
| REPLY_OWN_CONCERN_FORBIDDEN | 403 | 위로 작성 |
| REPLY_ALREADY_EXISTS | 409 | 위로 작성 |
| COMMON_IDEMPOTENCY_CONFLICT | 409 | 고민 작성 |
