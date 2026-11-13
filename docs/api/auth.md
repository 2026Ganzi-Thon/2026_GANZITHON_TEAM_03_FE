# 회원 - 인증 API (AUTH)

공통 규칙은 [common.md](./common.md) 참고. 개발 상황은 전부 "개발 전"(초안)이다. 이 도메인은 **Access Token 없이** 호출하는 API가 대부분이라 공통 문서의 "Authorization 필수" 설명이 적용되지 않는다(각 API의 권한 표시 참고).

## 토큰 정책 (확정)

- **Access Token**: 유효시간 1시간(`expiresIn: 3600`). 응답 JSON으로 받고 클라이언트 **메모리에만** 보관한다.
- **Refresh Token**: **응답 JSON에 없다.** `Set-Cookie` 헤더로만 내려온다. HttpOnly·Secure, 14일, 사용할 때마다 회전. 쿠키 이름 `refreshToken`, `Path=/api/v1/auth`는 제안이고 SameSite·Domain은 배포 전 합의.
- 프론트는 쿠키가 오가는 요청(`login`, `signup`, `google`, `refresh`, `logout`)에 **`credentials: 'include'`** (axios는 `withCredentials: true`)를 켜야 하고, 서버 CORS와 맞춰야 한다.
- 토큰이 담긴 응답에는 `Cache-Control: no-store`가 붙는다(제안).
- Access Token 만료(`AUTH_ACCESS_TOKEN_EXPIRED`) 시 `/auth/refresh`로 재발급한다. **재발급은 하나만 실행하고 동시에 실패한 요청들이 그 결과를 공유**하도록 한다(여러 탭·동시 갱신은 별도 검토).

```ts
type AuthSuccess = {            // 로그인·회원가입·구글 로그인 응답의 data
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number             // 3600
  user: {
    userId: string
    nickname: string | null     // 초기 설정 전이면 null
    profileCompleted: boolean   // 초기 프로필(닉네임 등) 완료 여부
    onboardingCompleted: boolean
  }
  isNewUser?: boolean           // 회원가입·구글 로그인에만 있음
}
```

로그인 후 `profileCompleted`, `onboardingCompleted`를 보고 초기 화면을 분기한다(초기 설정 → 온보딩 → 홈).

## 회원가입 흐름 (제안)

```
이메일 인증 메일 발송 → (메일의 링크) → 이메일 인증 확인 → signupVerificationToken → 일반 회원가입(자동 로그인)
```

## 1. 이메일 인증 메일 발송

`POST /api/v1/auth/email-verifications` · 202 · 비로그인 · (제안)

회원가입 전 이메일 소유 확인용 일회용 링크를 발송한다. 요청 수락과 실제 메일 도착은 다르다.

Body: `{ "email": "user@example.com" }` (이메일 형식, 최대 255자, 앞뒤 공백 제거)

Response `data: { message: string }` 예: "입력한 이메일로 인증 안내를 확인해주세요." — 계정 존재 여부에 따라 응답을 바꾸지 않고, 토큰 원문은 응답에 없다.

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 202 | - | 접수 |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 429 | AUTH_RATE_LIMITED | 이메일·IP 기준 발송 제한 |
| 503 | AUTH_MAIL_UNAVAILABLE | 발송 접수 시스템 사용 불가 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

미결정: 링크 만료 30분, 재발송 간격 60초(제안), 제한량·메일 제공자. 프론트는 재발송 버튼에 60초 쿨다운을 두는 게 안전하다.

## 2. 이메일 인증 확인

`POST /api/v1/auth/email-verifications/confirm` · 200 · 비로그인 · (제안)

메일 링크로 받은 일회용 토큰을 확인하고 회원가입에 쓸 **짧은 수명의 가입 증명**을 발급한다.

Body: `{ "token": "<email-verification-token>" }`

Response `data`: `{ email: string, signupVerificationToken: string, expiresIn: number }` (예: 600초)

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 400 | AUTH_EMAIL_VERIFICATION_INVALID | 위조·잘못된 목적의 토큰 |
| 410 | AUTH_EMAIL_VERIFICATION_EXPIRED | 유효기간 만료 |
| 409 | AUTH_EMAIL_VERIFICATION_USED | 이미 사용·무효화된 토큰 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 가입 증명은 대상 이메일·용도·만료에 묶이고 회원가입에 **한 번만** 쓸 수 있다. 링크 재접속·응답 유실 시 재인증 UX는 미정.

## 3. 일반 회원가입

`POST /api/v1/auth/signup` · 201 · 비로그인

이메일 소유 확인을 마친 가입 증명과 비밀번호·약관 동의로 계정을 만들고 **로그인 처리**까지 한다(자동 로그인은 제안).

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| email | string | 필수 | 이메일 형식, 최대 255자, 앞뒤 공백 제거 |
| password | string | 필수 | 15~64자(제안). 공백·유니코드 허용, 임의 trim 금지 |
| signupVerificationToken | string | 필수 | 이메일 인증 확인 API가 발급한 미사용 증명. 이메일과 일치해야 함 |
| termsVersion / privacyVersion | string | 필수 | 실제 고지한 문서 버전 (예시 `v1`은 확정 아님) |
| termsAgreed / privacyAgreed | boolean | 필수 | **true만 허용** |
| marketingVersion / marketingAgreed | string / boolean | 필수(제안) | 선택 동의. false여도 가입 가능, true면 버전 검증 |

```json
{
  "email": "user@example.com",
  "password": "MyQuietIsland!2026",
  "signupVerificationToken": "<signup-verification-token>",
  "termsVersion": "v1", "termsAgreed": true,
  "privacyVersion": "v1", "privacyAgreed": true,
  "marketingVersion": "v1", "marketingAgreed": false
}
```

Response `data: AuthSuccess` (`isNewUser: true`, `nickname: null`, `profileCompleted: false`) + `Set-Cookie: refreshToken=...`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 201 | - | 성공 |
| 400 | COMMON_INVALID_REQUEST | 요청 형식·필수값·타입 오류 |
| 400 | AUTH_REQUIRED_CONSENT_MISSING | 필수 약관 미동의 또는 버전 불일치 |
| 401 | AUTH_SIGNUP_VERIFICATION_INVALID | 가입 증명 없음·위조·만료·사용됨·이메일 불일치 |
| 409 | AUTH_EMAIL_DUPLICATED | 일반 로그인 이메일 중복 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 비밀번호 확인 입력 일치, 약관 개별 선택은 UI에서 검사한다(서버도 검증). 닉네임은 가입이 아니라 **초기 프로필 설정**에서 입력한다. 초기 양털 잔액은 0(제안). 이메일 사전 인증과 자동 로그인은 승인 필요, 구글 계정과 같은 이메일의 처리도 미정.

## 4. 일반 로그인

`POST /api/v1/auth/login` · 200 · 비로그인

Body: `{ "email": string, "password": string }` (비밀번호는 가입 정책을 로그인에서 강제하지 않고 그대로 비교)

Response `data: AuthSuccess` (`isNewUser` 없음) + `Set-Cookie: refreshToken=...`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 401 | AUTH_LOGIN_FAILED | 계정 없음·비밀번호 불일치·일반 로그인 불가를 **같은 문구**로 안내 |
| 429 | AUTH_RATE_LIMITED | 로그인 시도 제한 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 이메일 존재 여부와 비밀번호 오답을 구분해서 보여주지 않는다. 미결정: 동시 기기 로그인 범위, 실패 횟수·잠금 기간.

## 5. 구글 로그인 처리

`POST /api/v1/auth/google` · 200(기존 회원) / 201(신규) · 비로그인 · (제안)

Google Identity Services의 **ID Token**을 서버가 검증해 기존 회원을 로그인시키거나, 필수 약관 동의 후 신규 회원을 만든다. 인가 코드 교환 방식으로 확정된 것은 아니다.

| 필드 | 타입 | 필수 | 제약 |
| --- | --- | --- | --- |
| credential | string | 필수 | 구글 **ID Token** (서비스 Access Token·구글 OAuth Access Token과 다름) |
| termsVersion / privacyVersion | string | 신규 가입 시 필수 | |
| termsAgreed / privacyAgreed | boolean | 신규 가입 시 필수 | true만 허용 |
| marketingVersion / marketingAgreed | string / boolean | 신규 가입 시(제안) | 선택 동의 |

```json
{
  "credential": "<google-id-token>",
  "termsVersion": "v1", "termsAgreed": true,
  "privacyVersion": "v1", "privacyAgreed": true,
  "marketingVersion": "v1", "marketingAgreed": false
}
```

Response `data: AuthSuccess` + `isNewUser` (기존 연결 계정은 `false`·200, 신규는 `true`·201) + `Set-Cookie`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 기존 회원 로그인 |
| 201 | - | 신규 가입 |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 400 | AUTH_REQUIRED_CONSENT_MISSING | 필수 동의 거부·문서 버전 불일치 |
| 401 | AUTH_GOOGLE_TOKEN_INVALID | 구글 ID Token 검증 실패 |
| 409 | AUTH_SIGNUP_CONSENT_REQUIRED | 신규 사용자인데 서비스 동의 정보가 없음 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모

- **첫 호출에 약관 정보가 없으면** 신규 계정을 만들지 않고 `409 AUTH_SIGNUP_CONSENT_REQUIRED`를 준다. 이때 약관 동의 화면을 보여주고, 같은 `credential`로 동의 정보를 붙여 다시 요청한다(`credential`이 그 사이 만료되지 않았는지는 명세에 없어 확인 필요).
- 구글 정보 제공 동의와 서비스 약관 동의를 화면에서 구분하고, 구글 인증 취소는 프론트에서 안내한다.
- 일반 가입과 이메일이 같다는 이유로 계정을 자동 연결하지 않는다.
- 로그인 CSRF·`nonce`·`g_csrf_token` 처리와 ID Token 전달 방식은 프론트·백엔드가 합의해야 한다.

## 6. 토큰 재발급

`POST /api/v1/auth/refresh` · 200 · 전체

유효한 Refresh Token **쿠키**로 새 Access Token과 새 Refresh Token을 발급한다. 만료된 Access Token을 요구하지 않는다(`Authorization` 불필요).

- Request: 본문 없음. 쿠키 `refreshToken`만 필요. `credentials: 'include'` 필수. Origin/CSRF 검증 방식은 배포 후 확정.
- Response `data: { accessToken: string, tokenType: 'Bearer', expiresIn: number }` + 새 `Set-Cookie`

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 200 | - | 성공 |
| 401 | AUTH_REFRESH_TOKEN_INVALID | 쿠키 없음·위조·폐기·유효하지 않음 |
| 401 | AUTH_REFRESH_TOKEN_EXPIRED | Refresh Token 만료 |
| 401 | AUTH_REFRESH_TOKEN_REUSED | 이미 회전된 토큰 재사용 |
| 403 | AUTH_CSRF_FAILED | Origin 또는 CSRF 검증 실패 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 성공하면 기존 Refresh Token은 무효가 되므로 **같은 토큰으로 동시에 두 번 호출하지 않는다**(두 번째는 `REUSED`로 세션이 끊길 수 있음). 재발급 실패(401 3종)는 로그인 화면으로 보낸다. 미결정: 재사용 감지 시 세션 폐기 범위, 다중 탭·응답 유실 대응, 최대 로그인 유지 기간.

## 7. 로그아웃

`POST /api/v1/auth/logout` · 204 · 전체 · (제안)

Access Token 만료와 무관하게 현재 브라우저의 Refresh Token 세션을 폐기하고 쿠키를 지운다.

- Request: 본문 없음. 쿠키가 없거나 이미 폐기됐어도 쿠키 제거 후 **204**.
- Response: 본문 없음

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 204 | - | 성공 |
| 403 | AUTH_CSRF_FAILED | 허용되지 않은 Origin 또는 CSRF 검증 실패 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 성공 시 메모리의 Access Token과 개인 데이터 캐시를 지운다. API가 실패하면 서버 로그아웃이 완료됐다고 안내하지 말고 재시도 경로를 준다. Refresh 폐기만으로 이미 발급된 Access Token(최대 잔여 1시간)이 즉시 무효가 되지는 않는다. 미결정: 현재 기기/전체 기기 로그아웃 범위.

## 8. 비밀번호 재설정 메일 발송

`POST /api/v1/auth/password-resets` · 202 · 비로그인

일반 로그인 계정의 비밀번호 재설정 일회용 링크를 요청한다.

Body: `{ "email": string }`

Response `data: { message: string }` 예: "재설정 가능한 계정이면 안내 메일이 발송됩니다." — **등록 여부·소셜 전용 여부와 무관하게 항상 같은 202와 문구**를 준다.

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 202 | - | 접수 |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 429 | AUTH_RATE_LIMITED | 발송 요청 제한 |
| 503 | AUTH_MAIL_UNAVAILABLE | 발송 접수 시스템 사용 불가 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 소셜(구글) 전용 계정에는 메일이 가지 않는다(가입 안내가 아니라 같은 문구만 보임). 미결정: 링크 30분 만료, 재발송 60초, 제한 횟수.

## 9. 비밀번호 재설정

`PATCH /api/v1/auth/password-resets` · 204 · 비로그인

메일 링크의 토큰으로 일반 로그인 비밀번호를 바꾼다.

Body: `{ "token": string, "newPassword": string }` (`newPassword`는 회원가입과 같은 정책, 15~64자 제안)

Response: 본문 없음

| HTTP | 코드 | 의미 |
| --- | --- | --- |
| 204 | - | 성공 |
| 400 | COMMON_INVALID_REQUEST | 요청 형식 오류 |
| 400 | AUTH_PASSWORD_POLICY_VIOLATION | 새 비밀번호 정책 불충족 |
| 400 | AUTH_PASSWORD_RESET_INVALID | 토큰 위조·목적 불일치 |
| 410 | AUTH_PASSWORD_RESET_EXPIRED | 토큰 만료 |
| 409 | AUTH_PASSWORD_RESET_USED | 이미 사용·폐기된 토큰 |
| 500 | COMMON_INTERNAL_ERROR | 서버 오류 |

메모: 새 비밀번호 확인값은 UI에서만 비교한다. 재설정 링크 화면은 토큰이 외부로 새지 않게 `Referrer-Policy`를 쓰고 URL에서 토큰을 지운다. 성공해도 **자동 로그인은 하지 않고 로그인 화면으로 이동**한다. 같은 회원의 모든 Refresh 세션이 폐기된다(제안).

## 이 도메인 전용 오류 코드 요약

| 코드 | HTTP | 발생 API |
| --- | --- | --- |
| AUTH_RATE_LIMITED | 429 | 로그인·인증 메일·재설정 메일 |
| AUTH_MAIL_UNAVAILABLE | 503 | 인증 메일·재설정 메일 |
| AUTH_LOGIN_FAILED | 401 | 로그인 |
| AUTH_EMAIL_DUPLICATED | 409 | 회원가입 |
| AUTH_SIGNUP_VERIFICATION_INVALID | 401 | 회원가입 |
| AUTH_REQUIRED_CONSENT_MISSING | 400 | 회원가입·구글 |
| AUTH_SIGNUP_CONSENT_REQUIRED | 409 | 구글 |
| AUTH_GOOGLE_TOKEN_INVALID | 401 | 구글 |
| AUTH_EMAIL_VERIFICATION_INVALID / _EXPIRED / _USED | 400 / 410 / 409 | 인증 확인 |
| AUTH_REFRESH_TOKEN_INVALID / _EXPIRED / _REUSED | 401 | 토큰 재발급 |
| AUTH_CSRF_FAILED | 403 | 재발급·로그아웃 |
| AUTH_PASSWORD_POLICY_VIOLATION / _RESET_INVALID / _RESET_EXPIRED / _RESET_USED | 400 / 400 / 410 / 409 | 비밀번호 재설정 |
