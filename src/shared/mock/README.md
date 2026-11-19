# shared/mock — 가짜 DB

실제 API 가 붙기 전까지 **서버 DB 역할**을 한다. 기능마다 따로 있던 mock 을 한곳에 모아서
닉네임·양털·감정 기록·고민(위로할 고민·내가 쓴 고민)·섬 꾸미기 보유 가구·휴식 세션이 화면 사이에서 이어지고, 새로고침해도 남는다.

- 상태 하나를 메모리에 두고 쓸 때마다 `localStorage['polly.mockDb']` 에 `{ version, ...state }` 로 저장한다.
  처음 쓸 때 불러오고, 읽지 못하거나 `version` 이 다르면 시드(`seed.ts`)로 다시 시작한다.
- storage 를 못 쓰면(사파리 비공개 모드 등) 메모리로만 동작한다.
- 시드의 "N일 전" 날짜는 시드를 만들 때 한 번 계산해 절대 날짜로 저장한다.
- 주소에 `?reset` 을 붙여 열면 이 DB 와 시작 흐름 기록을 지운다(`app/resetDemo.ts`).

## 누가 import 하나

**기능의 `*Api.ts`(와 `shared/wool/woolApi.ts`)만.** 예외는 `app/resetDemo.ts` 의 `resetMockDb` 하나.
컴포넌트·훅·쿼리는 import 하지 않는다.

## API 연결 때

각 `*Api.ts` 함수 본문을 `api.get/post…` 호출로 바꾸고 `app/resetDemo.ts` 를 지우면 이 폴더는 통째로 지울 수 있다.
