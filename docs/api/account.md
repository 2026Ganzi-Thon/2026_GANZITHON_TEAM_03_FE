# 회원 - 계정 API (ACCOUNT)

공통 규칙은 [common.md](./common.md), 토큰 정책은 [auth.md](./auth.md) 참고. 모든 API는 로그인 사용자 전용(`Authorization: Bearer {accessToken}`)이고 개발 상황은 전부 "개발 전"(초안)이다. 요청에 `userId`를 넣지 않는다(토큰의 사용자).

```ts
type Profile = {
  userId: string
  nickname: string
  profileImageUrl: string | null   // 구글 기본 이미지 등. 업로드 교체는 별도 계약 필요
  introduction: string             // 최대 200자 (제안), 없으면 제거
  ageGroup: string | null          // 코드 목록 미정
  regionCode: string | null        // 지역 단위·필수 여부 미정
  profileCompleted: boolean
  onboardingCompleted: boolean
}
```

## 초기 진입 흐름

로그인/가입 응답의 `profileCompleted`와 `onboardingCompleted`로 분기한다.

```
가입/로그인 → profileCompleted=false → 초기 프로필 설정 (닉네임 중복 확인) → 온보딩 → 온보딩 완료 처리 → 홈
```

프로필이 미완료인 사용자가 다른 API를 어디까지 쓸 수 있는지는 회원 담당자와 합의 전이다.

## 1. 내 정보 조회

`GET /api/v1/users/me` · 200

로그인한 본인의 서비스 프로필과 초기 설정·온보딩 상태를 조회한다.

Response `data: Profile & { contactEmail, loginProviders, createdAt }`

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| contactEmail | string | 연락용 이메일. 일반 로그인 ID 변경 권한을 뜻하지 않음 |
| loginProviders | `('LOCAL' \| 'GOOGLE')[]` | 로그인 수단 코드 (제안) |
| createdAt | string | UTC ISO 8601 |

비밀번호 해시·토큰·`google_sub`는 응답에 없다. 초기 미설정 값(`nickname` 등)은 null로 온다.

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 404 | USER_NOT_FOUND | 인증 대상 회원 없음 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

미결정: 연락용 이메일 응답 필요성, 나이대·지역 코드 목록.

## 2. 내 정보 수정

`PATCH /api/v1/users/me` · 200

요청에 **포함한 항목만** 수정한다(누락 필드는 유지). 이메일·비밀번호·약관·초기 완료 상태는 이 API에서 바꾸지 않는다.

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| nickname | string | 선택 | trim 후 2~30자, 한글·영문·숫자·밑줄, 중복 불가 (제안). **null 불가** |
| introduction | string \| null | 선택 | 최대 200자 (제안). null이면 제거 |
| ageGroup | string \| null | 선택 | 코드 목록 미정. null이면 제거 |
| regionCode | string \| null | 선택 | 허용된 코드만. null이면 제거 |

```json
{ "introduction": "오늘은 천천히 쉬어가요." }
```

Response `data: Profile`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 |
| 400 | COMMON_INVALID_REQUEST | 형식·범위 오류, **빈 body·미지원 필드** (제안) |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 409 | USER_NICKNAME_DUPLICATED | 닉네임 중복 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 프로필 이미지 변경(업로드·파일 소유 확인)과 임의 외부 URL 수용은 이번 초안에서 제외다.

## 3. 초기 프로필 설정

`PATCH /api/v1/users/me/initial-profile` · 200

가입 후 닉네임 등 필수 초기 설정을 검증하고 프로필 완료 상태로 바꾼다. **프로필이 미완료인 사용자도 호출할 수 있다.**

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| nickname | string | **필수** | 내 정보 수정과 같은 규칙 |
| introduction | string \| null | 선택 | 최대 200자 |
| ageGroup | string \| null | 선택 | |
| regionCode | string \| null | 선택 | 필수 여부 미정 |

```json
{ "nickname": "온기", "introduction": "오늘 할 수 있는 만큼" }
```

Response `data: Profile` (`profileCompleted: true`)

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 (같은 값의 반복 요청도 기존 성공 반환) |
| 400 | COMMON_INVALID_REQUEST | 형식·필수값·범위 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 409 | USER_NICKNAME_DUPLICATED | 닉네임 중복 |
| 409 | USER_INITIAL_PROFILE_ALREADY_COMPLETED | 이미 완료한 뒤 다른 값으로 다시 요청 → 내 정보 수정을 사용 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 초기 설정으로 양털을 지급하지 않는다. 관심사 선택은 현재 구조에 없어 제외. 미결정: 지역·나이대 필수 여부, 닉네임 규칙.

## 4. 닉네임 중복 확인

`GET /api/v1/users/nickname-availability?nickname=온기` · 200

| 필드 | 위치 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- | --- |
| nickname | Query | string | 필수 | 초기 프로필과 같은 형식·길이·정규화 |

Response `data: { nickname: string, available: boolean }`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 |
| 400 | COMMON_INVALID_REQUEST | 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 429 | AUTH_RATE_LIMITED | 조회 요청 제한 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모

- **내 현재 닉네임은 `available: true`.** 다른 사람이 쓰고 있으면 409가 아니라 `available: false`로 온다.
- 이 결과는 **예약이 아니다.** 저장할 때 충돌하면 저장 API가 409를 준다.
- 입력할 때마다 호출하지 말고 디바운스를 건다(429 제한 있음).

## 5. 온보딩 완료 처리

`PATCH /api/v1/users/me/onboarding` · 200

기능 안내를 본 사용자의 온보딩 처리 상태를 저장한다.

Body: `{ "completed": true }` (**true만 허용**, 시각은 보내지 않음)

Response `data: { onboardingCompleted: boolean, onboardingCompletedAt: string }`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 (반복 요청은 시각을 덮어쓰지 않고 기존 값 반환) |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 온보딩 다시 보기는 프론트 기능으로 제공하고 이 값으로 접근을 막지 않는다. 미결정: **"건너뛰기"도 완료로 볼지**(추천은 완료로 간주), 일반·구글 가입 후 초기 설정과 온보딩의 화면 순서.

## 6. 내 약관 동의 내역 조회

`GET /api/v1/users/me/consents` · 200

약관별 **현재(가장 최근) 동의 상태**를 조회한다. 전체 변경 이력은 아니다. 이력이 없으면 `items: []`.

Response `data.items`

```ts
{
  consentType: 'TERMS' | 'PRIVACY' | 'MARKETING'
  termsVersion: string      // 예: "v1"
  agreed: boolean
  recordedAt: string
}[]
```

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

미결정: 약관 코드·실제 버전·문서 URL 제공 방식. 갱신된 약관 재동의 API는 범위가 정해진 뒤에 추가된다.

## 7. 마케팅 수신 동의 변경

`PATCH /api/v1/users/me/consents/marketing` · 200

선택 항목인 마케팅 수신 동의를 바꾸고 **이력을 추가**한다(덮어쓰지 않음). 필수 이용약관 철회를 대신하지 않는다. 거부·철회해도 핵심 기능 이용은 제한되지 않는다.

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| agreed | boolean | 필수 | true 또는 false |
| termsVersion | string | 필수 | true면 사용자가 고지받은 **현재 허용 버전**. false(철회)는 기존 동의 버전으로 가능 |

```json
{ "agreed": false, "termsVersion": "v1" }
```

Response `data: { consentType: 'MARKETING', termsVersion: string, agreed: boolean, recordedAt: string }`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 (같은 상태·버전 반복은 기존 결과 반환) |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 401 | AUTH_ACCESS_TOKEN_INVALID / _EXPIRED | 토큰 오류 / 만료 |
| 409 | CONSENT_VERSION_MISMATCH | 새 동의에 쓴 약관 버전이 유효하지 않음 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 새 버전 불일치를 이유로 **기존 수신 동의 철회 자체를 막지 않는다.** 마케팅 기능의 실제 제공 여부·문구·버전 관리 담당은 미정.

## 이 도메인 전용 오류 코드 요약

| 코드 | HTTP | 발생 API |
| --- | --- | --- |
| USER_NOT_FOUND | 404 | 내 정보 조회 |
| USER_NICKNAME_DUPLICATED | 409 | 내 정보 수정·초기 프로필 설정 |
| USER_INITIAL_PROFILE_ALREADY_COMPLETED | 409 | 초기 프로필 설정 |
| CONSENT_VERSION_MISMATCH | 409 | 마케팅 수신 동의 변경 |
| AUTH_RATE_LIMITED | 429 | 닉네임 중복 확인 |
