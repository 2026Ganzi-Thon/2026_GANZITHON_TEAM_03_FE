# shared/mock — 섬 꾸미기 가짜 DB

다른 기능은 실제 백엔드 API 에 연결됐고, **섬 꾸미기만** 백엔드 API 가 없어 여기 남았다.
섬 꾸미기에서 산 아이템 ID 만 이 기기의 `localStorage['polly.mockDb']` 에 `{ version: 5, ownedItemIds }` 로 저장한다.

- 아이템 목록(이름·값·그림)은 그림 import 가 있어 `features/island/islandApi.ts` 상수.
- 양털 잔액은 서버 값(`GET /wool-wallet`)을 보여준다. 서버 양털을 깎을 수 없어서 구매는 잔액이 값 이상인지만 확인하고 차감하지 않는다.
- 이전 형식(버전 1~4, 감정·고민·휴식까지 흉내 내던 통합 가짜 DB)의 산 아이템은 이어받는다.
- 기기에 저장하므로 계정과 상관없다(같은 기기에서 계정을 바꿔도 산 가구가 남는다).
- storage 를 못 쓰면(사파리 비공개 모드 등) 메모리로만 동작한다.
- 주소에 `?reset` 을 붙여 열면 산 아이템과 온보딩 본 기록을 지운다(`app/resetDemo.ts`).

## 누가 import 하나

`features/island/islandApi.ts` 만. 예외는 `app/resetDemo.ts` 의 `resetMockIsland` 하나.

## API 연결 때

섬 꾸미기 API 가 생기면 `islandApi.ts` 본문을 호출로 바꾸고(그 파일의 `TODO(API 연결)`), `app/resetDemo.ts` 의 초기화를 지우면 이 폴더는 통째로 지울 수 있다.
