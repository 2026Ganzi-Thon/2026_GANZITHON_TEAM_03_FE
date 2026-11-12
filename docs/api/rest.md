# 휴식 API (REST)

공통 규칙은 [common.md](./common.md) 참고. 로그인 사용자 전용, 개발 상황 "검토 필요"(초안), 요구사항 F-4.

## 개념

- 휴식은 **세션**이다. 시작하면 서버가 `startedAt`과 `scheduledEndAt`(= 시작 + 설정 시간)을 정한다. 수동 버튼과 센서 감지가 **같은 API**를 호출한다.
- 완료 여부는 **서버 시각**으로 판단한다. 서버 시각이 `scheduledEndAt` 이상이면 `COMPLETED`이고 `endedAt = scheduledEndAt`이다. 클라이언트의 경과 시간이나 센서값으로 완료를 확정하지 않는다.
- 사용자당 진행 중 세션은 하나(제안).
- 센서 권한을 거절했거나 지원하지 않는 기기는 수동 시작을 제공한다. 센서값·각도·권한 상태는 서버에 저장하지 않는다.
- 남은 시간은 `serverTime`과 `scheduledEndAt`으로 화면에서 계산한다. 매초 서버를 호출하지 않고, 앱에 돌아왔을 때 `현재 휴식 상태 조회`를 다시 호출한다.
- 백그라운드에서 센서가 계속 동작하거나 종료 알림이 보장된다는 전제로 만들지 않는다.

```ts
type RestSession = {
  sessionId: string
  plannedDurationSeconds: number   // 설정한 초 단위 휴식 시간
  startedAt: string
  scheduledEndAt: string
  endedAt: string | null
  status: 'RUNNING' | 'COMPLETED' | 'CANCELLED'   // 제안
  afterMemo: string | null         // 최대 500자 (제안)
}
```

화면 흐름: 진입/복귀 시 `현재 휴식 상태 조회` → 없으면 `휴식 시작` → 타이머 → (종료 확인 후) `휴식 중도 종료` 또는 시간 만료 → 종료 화면에서 `휴식 후 상태 기록`.

## 1. 휴식 시작

`POST /api/v1/rest-sessions` · 201

| 필드 | 위치 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- | --- |
| Idempotency-Key | Header | UUID | 필수 | 한 시작 동작의 재시도에 같은 키 |
| plannedDurationSeconds | Body | integer | 필수 | 60~3,600초 (제안) |

```json
{ "plannedDurationSeconds": 300 }
```

`startedAt`, `scheduledEndAt`, `userId`, `status`는 body로 받지 않는다(서버가 계산).

Response `data`: `{ serverTime: string, session: RestSession }` (`status: "RUNNING"`)

```json
{
  "data": {
    "serverTime": "2026-11-08T05:00:00Z",
    "session": {
      "sessionId": "401", "plannedDurationSeconds": 300,
      "startedAt": "2026-11-08T05:00:00Z", "scheduledEndAt": "2026-11-08T05:05:00Z",
      "endedAt": null, "status": "RUNNING", "afterMemo": null
    }
  }
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 201 | - | 새 휴식 시작 |
| 400 | REST_INVALID_DURATION | 허용 시간 범위·정수 타입 오류 |
| 400 | COMMON_INVALID_REQUEST | 키·요청 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 409 | REST_ALREADY_RUNNING | 아직 시간이 남은 내 휴식이 있음 |
| 409 | COMMON_IDEMPOTENCY_CONFLICT | 같은 키로 다른 요청 또는 처리 중 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 예정 종료를 지난 RUNNING 행이 남아 있으면 서버가 같은 트랜잭션에서 `COMPLETED`로 정리한 뒤 새 세션을 만든다.

## 2. 현재 휴식 상태 조회

`GET /api/v1/rest-sessions/current` · 200

진행 중 세션을 우선으로, 없으면 가장 최근 세션의 현재 상태를 조회한다. 앱 재진입·화면 복귀 시 타이머와 종료 화면을 복원한다. 이 GET은 DB를 바꾸지 않는다.

Response `data`

| 필드 | 타입 | NULL | 설명 |
| --- | --- | --- | --- |
| serverTime | string | N | 서버 현재 시각 (남은 시간 계산 기준) |
| remainingSeconds | integer | N | `RUNNING`은 `max(0, ceil(예정 종료 - 현재))`, 종료 상태·세션 없음은 0 |
| session | RestSession \| null | Y | 이력이 아예 없으면 null |

```json
{
  "data": {
    "serverTime": "2026-11-08T05:02:00Z",
    "remainingSeconds": 180,
    "session": {
      "sessionId": "401", "plannedDurationSeconds": 300,
      "startedAt": "2026-11-08T05:00:00Z", "scheduledEndAt": "2026-11-08T05:05:00Z",
      "endedAt": null, "status": "RUNNING", "afterMemo": null
    }
  }
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공. 세션 없음은 `session: null`, `remainingSeconds: 0` |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: DB가 `RUNNING`이어도 예정 종료를 지났으면 응답은 `COMPLETED`, `endedAt = scheduledEndAt`으로 계산해서 준다. 홈에서도 원시 status가 아니라 같은 계산을 써야 한다.

## 3. 휴식 중도 종료

`POST /api/v1/rest-sessions/{sessionId}/cancel` · 200

내 진행 중 휴식을 서버 시각 기준으로 중도 종료한다. 클라이언트에서 종료 확인창을 띄운 뒤 호출한다. 휴대폰을 들었다는 이유만으로 자동 종료하지 않는다.

- Path: `sessionId` (본인 세션), 본문 없음. 예: `POST /api/v1/rest-sessions/401/cancel`
- Response `data: { session: RestSession }`

결과 상태 규칙

- 예정 종료 전 `RUNNING` → `CANCELLED`, `endedAt = 서버 현재 시각`
- 이미 예정 종료를 지났다면 → `COMPLETED`, `endedAt = scheduledEndAt` (정상 완료를 중도 종료로 덮어쓰지 않음)
- 이미 `CANCELLED`/`COMPLETED`면 그 상태를 그대로 반환 (`endedAt` 불변)

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 중도 종료, 또는 이미 종료된 최종 상태 반환 |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 404 | REST_SESSION_NOT_FOUND | 없거나 내 세션이 아님 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

## 4. 휴식 후 상태 기록

`PATCH /api/v1/rest-sessions/{sessionId}/after-memo` · 200

종료된 내 휴식 세션에 선택 메모를 작성·수정·삭제한다. 중도 종료한 세션에도 허용하는 초안이다. 감정 기록과 별개의 메모이고, 감정 기록을 자동으로 만들거나 고치지 않는다. 감정 선택·점수 입력은 포함하지 않는다.

| 필드 | 위치 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- | --- |
| sessionId | Path | ID | 필수 | 본인 소유의 종료된 세션 |
| afterMemo | Body | string \| null | 필수 | 최대 500자. null·공백뿐이면 삭제. **생략은 오류** |

```json
{ "afterMemo": "잠깐 쉬니 머리가 맑아졌다." }
```

Response `data: { session: RestSession }` (메모 반영 후)

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 저장·수정·비우기 성공 |
| 400 | COMMON_INVALID_REQUEST | 필드 누락·길이·타입 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 404 | REST_SESSION_NOT_FOUND | 없거나 내 세션이 아님 |
| 409 | REST_NOT_ENDED | 예정 종료 전 진행 중 세션 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 예정 종료를 지났지만 DB에 `RUNNING`으로 남은 세션은 서버가 정상 완료 처리한 뒤 메모를 저장한다. 진행 중 세션에 메모를 보내 종료 상태를 만드는 것은 허용하지 않는다.

## Idempotency-Key

`휴식 시작`에만 필요하다(제안). 같은 동작의 재시도는 같은 UUID, 새 동작은 새 UUID. 상세 규칙은 [care-wool.md](./care-wool.md)의 Idempotency-Key 항목과 같다.

## 이 도메인 전용 오류 코드 요약

| 코드 | HTTP | 발생 API |
| --- | --- | --- |
| REST_INVALID_DURATION | 400 | 휴식 시작 |
| REST_ALREADY_RUNNING | 409 | 휴식 시작 |
| REST_SESSION_NOT_FOUND | 404 | 중도 종료·후 상태 기록 |
| REST_NOT_ENDED | 409 | 후 상태 기록 |

## 미결정 사항

- 휴식 시간 범위(60~3,600초), 사용자당 진행 중 세션 하나
- 정상 완료를 DB에 반영하는 방식 (주기 작업 도입 여부)
- 메모 500자, 중도 종료 후 메모 작성 허용 여부
- Idempotency-Key 적용 여부와 24시간 보관
