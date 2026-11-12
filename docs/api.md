# API 명세 정리

노션 "API 명세서 (1)" 데이터베이스(간지톤 / 자료모음)를 기준으로 정리했다. 이 파일은 **전체 목록(인덱스)** 이고, 요청·응답 필드와 오류 코드는 도메인별 문서에 있다.

- 공통 prefix: `/api/v1`
- 권한: **비로그인** / **로그인** / **전체**
- 개발 상황: 검토 필요 / 개발 전 (완료된 API 없음, 우선순위 미정)
- "제안"이라고 적힌 항목은 확정이 아닌 설계 초안이다. 노션 원문에도 "검토용 명세 초안"이라고 되어 있다.

## 상세 문서

| 문서 | 내용 |
| --- | --- |
| [api/common.md](./api/common.md) | 토큰·ID·날짜 형식, 오류 응답, 페이지네이션, Idempotency-Key, 프론트 처리 메모 |
| [api/auth.md](./api/auth.md) | 회원가입·로그인·구글 로그인·이메일 인증·토큰 재발급·로그아웃·비밀번호 재설정 (9개) |
| [api/account.md](./api/account.md) | 내 정보·초기 프로필·닉네임 확인·온보딩·약관 동의 (7개) |
| [api/home.md](./api/home.md) | 홈 요약 (1개) |
| [api/emotion.md](./api/emotion.md) | 감정 목록·감정 기록 작성/조회/수정/삭제 (6개) |
| [api/cheese.md](./api/cheese.md) | 고민 작성·위로 답장·치즈 개봉·보관 (11개) |
| [api/care-wool.md](./api/care-wool.md) | 돌봄 행동·양털 잔액·변동 내역 (6개) |
| [api/rest.md](./api/rest.md) | 휴식 세션 (4개) |

## 인증 흐름 메모

- Access Token + Refresh Token을 쓰고, Refresh Token은 쿠키로 전달된다. 재발급은 Access Token 만료를 요구하지 않는다.
- 회원가입: 이메일 인증 메일 발송 → 인증 확인(가입 증명 발급) → 회원가입(자동 로그인). 구글 로그인은 ID Token을 서버에서 검증하는 방식(제안).
- 가입 후 초기 프로필(닉네임 등)과 온보딩 완료 상태를 별도로 저장한다.

## 회원

### AUTH

| API | METHOD | URL | 권한 | 설명 |
| --- | --- | --- | --- | --- |
| 일반 회원가입 | POST | `/auth/signup` | 비로그인 | 이메일 인증 증명, 비밀번호, 약관 동의로 계정 생성 후 로그인 처리 |
| 일반 로그인 | POST | `/auth/login` | 비로그인 | 이메일·비밀번호 검증 후 서비스 토큰 발급 |
| 구글 로그인 처리 | POST | `/auth/google` | 비로그인 | Google ID Token 검증, 기존 회원 로그인 또는 신규 생성 (제안) |
| 이메일 인증 메일 발송 | POST | `/auth/email-verifications` | 비로그인 | 가입 전 이메일 소유 확인용 일회용 링크 발송 (제안) |
| 이메일 인증 확인 | POST | `/auth/email-verifications/confirm` | 비로그인 | 일회용 토큰 확인 후 짧은 수명의 가입 증명 발급 (제안) |
| 토큰 재발급 | POST | `/auth/refresh` | 전체 | Refresh Token 쿠키로 새 Access/Refresh Token 발급 |
| 로그아웃 | POST | `/auth/logout` | 전체 | 현재 브라우저의 Refresh Token 세션 폐기, 쿠키 제거 (제안) |
| 비밀번호 재설정 메일 발송 | POST | `/auth/password-resets` | 비로그인 | 비밀번호 재설정용 일회용 링크 요청 |
| 비밀번호 재설정 | PATCH | `/auth/password-resets` | 비로그인 | 유효한 재설정 토큰으로 비밀번호 변경 |

### ACCOUNT

| API | METHOD | URL | 권한 | 설명 |
| --- | --- | --- | --- | --- |
| 내 정보 조회 | GET | `/users/me` | 로그인 | 본인 프로필과 초기 설정·온보딩 상태 조회 |
| 내 정보 수정 | PATCH | `/users/me` | 로그인 | 요청에 포함한 프로필 항목만 수정 (이메일·비밀번호·약관·초기 완료 상태 제외) |
| 초기 프로필 설정 | PATCH | `/users/me/initial-profile` | 로그인 | 닉네임 등 필수 초기 설정 검증 후 프로필 완료 처리 |
| 닉네임 중복 확인 | GET | `/users/nickname-availability` | 로그인 | 닉네임 사용 가능 여부 조회 |
| 온보딩 완료 처리 | PATCH | `/users/me/onboarding` | 로그인 | 기능 안내를 본 사용자의 온보딩 상태 저장 |
| 내 약관 동의 내역 조회 | GET | `/users/me/consents` | 로그인 | 약관별 현재 동의 상태 조회 |
| 마케팅 수신 동의 변경 | PATCH | `/users/me/consents/marketing` | 로그인 | 선택 항목인 마케팅 수신 동의 변경, 이력 저장 |

## 메인 홈 (HOME)

| API | METHOD | URL | 권한 | 설명 |
| --- | --- | --- | --- | --- |
| 홈 요약 조회 | GET | `/home` | 로그인 | 누적 양털, 오늘의 감정, 숙성이 끝난 치즈 수를 한 번에 조회 |

## 감정 기록 (EMOTION)

| API | METHOD | URL | 권한 | 설명 |
| --- | --- | --- | --- | --- |
| 감정 목록 조회 | GET | `/emotions` | 로그인 | 선택 가능한 활성 감정 목록을 표시 순서대로 조회 |
| 감정 기록 작성 및 먹이 주기 | POST | `/emotion-records` | 로그인 | 감정 1개 이상과 선택 메모로 오늘의 비공개 기록 생성. 먹이 주기 애니메이션은 저장 성공 후 클라이언트에서 표시 |
| 감정 기록 목록 조회 | GET | `/emotion-records` | 로그인 | 내 기록을 날짜 범위로 조회 (캘린더·지난 기록) |
| 감정 기록 상세 조회 | GET | `/emotion-records/{recordId}` | 로그인 | 기록 한 건의 메모와 선택 감정 조회 |
| 감정 기록 수정 | PATCH | `/emotion-records/{recordId}` | 로그인 | 감정·메모 부분 수정. 과거 기록 수정 허용, 날짜는 변경 불가 (초안) |
| 감정 기록 삭제 | DELETE | `/emotion-records/{recordId}` | 로그인 | 기록 한 건 삭제. 확인창은 클라이언트, 소유권 검증은 서버 |

## 고민·위로 (치즈)

### CONCERN

| API | METHOD | URL | 권한 | 설명 |
| --- | --- | --- | --- | --- |
| 고민 작성 및 숙성 시작 | POST | `/concerns` | 로그인 | 본문과 원하는 위로 방식으로 고민 생성, 숙성 종료 시각은 서버가 결정 |
| 위로할 고민 목록 조회 | GET | `/concerns` | 로그인 | 다른 사용자의 숙성 중 고민을 무작위로 최대 100개 조회, 목록 진입 시 한 번 호출 |
| 고민 상세 조회 | GET | `/concerns/{concernId}` | 로그인 | 고민 본문과 상태 조회 (받은 위로는 미포함) |
| 고민 및 치즈 삭제 | DELETE | `/concerns/{concernId}` | 로그인 | 내 고민 삭제. 모든 상태에서 같은 API, 달린 위로도 함께 삭제 |
| 내 치즈 목록 및 숙성 상태 조회 | GET | `/users/me/concerns` | 로그인 | 내 고민을 숙성 상태와 함께 최신순 조회 |
| 치즈 개봉 | POST | `/concerns/{concernId}/open` | 로그인 | 숙성이 끝난 내 고민을 개봉하고 받은 위로 반환 (없으면 기본 위로 하나 추가) |
| 치즈 보관 | PATCH | `/concerns/{concernId}/save` | 로그인 | 개봉한 치즈를 보관함에 넣기 |
| 치즈 보관 취소 | PATCH | `/concerns/{concernId}/unsave` | 로그인 | 보관함에서 빼고 개봉 상태로 복귀 (삭제 아님) |
| 치즈 보관함 목록 조회 | GET | `/users/me/saved-concerns` | 로그인 | 보관한 치즈를 보관 시각 최신순 조회 |

### REPLY

| API | METHOD | URL | 권한 | 설명 |
| --- | --- | --- | --- | --- |
| 위로 답장 작성 | POST | `/concerns/{concernId}/replies` | 로그인 | 다른 사용자의 숙성 중 고민에 위로 작성. 고민당 1회, 자기 고민 불가 |
| 받은 위로 목록 조회 | GET | `/concerns/{concernId}/replies` | 로그인 | 개봉한 내 치즈의 위로를 다시 조회 |

## 자기 돌봄·양털

### CARE

| API | METHOD | URL | 권한 | 설명 |
| --- | --- | --- | --- | --- |
| 돌봄 행동 목록 조회 | GET | `/care-actions` | 로그인 | 오늘 실천할 수 있는 활성 돌봄 행동과 현재 보상량 조회 |
| 돌봄 행동 완료 | POST | `/care-actions/{careActionId}/completions` | 로그인 | 오늘의 돌봄 행동 완료, 서버가 정한 양털 적립 |
| 오늘의 돌봄 완료 내역 조회 | GET | `/care-completions/today` | 로그인 | 한국 날짜 기준 오늘의 완료 상태 조회 (체크 표시 복원) |
| 돌봄 행동 완료 취소 | POST | `/care-completions/{completionId}/cancel` | 로그인 | 오늘의 완료를 취소하고 지급된 양털 회수 |

### WOOL

| API | METHOD | URL | 권한 | 설명 |
| --- | --- | --- | --- | --- |
| 양털 잔액 조회 | GET | `/wool-wallet` | 로그인 | 사용 가능한 양털 잔액 조회 |
| 양털 변동 내역 조회 | GET | `/wool-transactions` | 로그인 | 양털 증감 이력을 최신순 조회 |

## 휴식 (REST)

| API | METHOD | URL | 권한 | 설명 |
| --- | --- | --- | --- | --- |
| 휴식 시작 | POST | `/rest-sessions` | 로그인 | 휴식 세션 생성, 서버 기준 예정 종료 시각 반환. 수동 버튼·센서 감지가 같은 API 호출 |
| 현재 휴식 상태 조회 | GET | `/rest-sessions/current` | 로그인 | 진행 중 또는 가장 최근 세션 상태 조회 (재진입 시 타이머·종료 화면 복원) |
| 휴식 중도 종료 | POST | `/rest-sessions/{sessionId}/cancel` | 로그인 | 진행 중 휴식을 서버 시각 기준으로 중도 종료 |
| 휴식 후 상태 기록 | PATCH | `/rest-sessions/{sessionId}/after-memo` | 로그인 | 종료된 세션에 선택 메모 작성·수정·삭제 (중도 종료 세션 포함, 초안) |

## 프론트 기능 폴더 매핑 (안)

| 도메인 | `features/` 폴더 |
| --- | --- |
| 회원 | `auth` |
| 감정 기록 | `emotion` |
| 고민·위로 | `cheese` |
| 자기 돌봄·양털 | `wool` |
| 휴식 | `rest` |
| 메인 홈 | 별도 기능 폴더 없이 `pages/HomePage`에서 각 기능을 조합 (`GET /home`은 `shared` 또는 `pages`에서 호출) |
