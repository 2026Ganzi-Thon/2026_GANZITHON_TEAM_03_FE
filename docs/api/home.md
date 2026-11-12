# 메인 홈 API (HOME)

공통 규칙은 [common.md](./common.md) 참고. 로그인 사용자 전용, 개발 상황 "검토 필요"(초안), 요구사항 HOME-01.

## 홈 요약 조회

`GET /api/v1/home` · 200

홈 화면에 필요한 요약을 한 번에 조회한다. 상단의 누적 양털, 중앙의 오늘의 감정, 숙성이 끝난 치즈 알림에 쓴다. 섬·양 연출과 기능 바로가기는 화면에서 처리하고, **휴식 상태는 이 API에 없다**(휴식 도메인의 "현재 휴식 상태 조회"를 따로 호출).

- Request: Header `Authorization`만. 본문·Query 없음.

Response `data`

| 필드 | 타입 | NULL | 설명 |
| --- | --- | --- | --- |
| nickname | string \| null | Y | 초기 설정 전이면 null |
| woolBalance | integer | N | 현재 **사용 가능** 양털, 0 이상 (지갑이 없으면 0) |
| today | string | N | 서버 기준 오늘 날짜 `YYYY-MM-DD` (Asia/Seoul) |
| todayEmotion | object | N | 오늘의 감정 요약 |
| todayEmotion.recorded | boolean | N | 오늘 감정 기록 여부 |
| todayEmotion.recordId | string \| null | Y | 기록이 없으면 null |
| todayEmotion.emotions | `{ emotionId, code, name }[]` | N | 기록이 없으면 `[]` |
| maturedConcernCount | integer | N | 숙성이 끝났지만 아직 개봉하지 않은 내 고민 수 (제안 필드) |

```json
{
  "data": {
    "nickname": "온기",
    "woolBalance": 12,
    "today": "2026-11-08",
    "todayEmotion": {
      "recorded": true,
      "recordId": "101",
      "emotions": [{ "emotionId": "2", "code": "CALM", "name": "평온" }]
    },
    "maturedConcernCount": 1
  }
}
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모

- 감정 표현(`emotionId`·`code`·`name`)은 감정 기록 응답과 같은 형식이다. 오늘 기록이 없으면 `recorded: false`로 "감정 기록하러 가기" 같은 화면을 보이면 된다.
- `maturedConcernCount`가 1 이상이면 홈에서 "숙성이 끝난 치즈가 있어요" 알림을 띄워 내 치즈 목록(개봉)으로 이어준다.
- 홈의 "누적 양털"이라는 표현과 이 API의 `woolBalance`(현재 사용 가능 잔액)는 다른 값일 수 있어 표시 의미를 합의해야 한다.

미결정: 오늘의 감정 요약 로직(현재는 오늘 고른 감정을 그대로 반환), 나의 섬에 보여줄 요소와 섬꾸미기 데이터, `maturedConcernCount` 포함 여부.
