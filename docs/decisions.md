# 의사결정 기록

PR 댓글 자동 답변(Claude)의 근거. 작성 규칙은 `CLAUDE.md`의 "의사결정 기록" 참고.

## 2026-11-12 공통 컴포넌트 (`src/shared/ui/`)

- 2곳 이상 반복되는 UI만 공통 컴포넌트로 만듦(19종) — 화면 전용 UI는 feature/page 몫
- 만들지 않음: 시간 선택 알약, 우유 고민 카드, 치즈 보관함 배너, 기록·돌봄 목록 행, "치즈 만들기" 구분선, 섬 꾸미기 바텀시트, Google 로그인 버튼 — 한 곳에서만 쓰이거나 feature 성격
- Button 로딩 상태 없음 — Figma에 없음
- Modal은 네이티브 `<dialog>` — 포커스 가두기·ESC·배경 inert를 브라우저가 처리
- Icon은 SVG mask(색은 `color`) — 아이콘 라이브러리를 추가하지 않기 위해
- TabBar·Tabs는 라우터/패널에 의존하지 않음 — 이동과 `aria-controls`는 쓰는 쪽 몫
- 색은 Design System 팔레트(`#59603b` 등)를 따름 — 화면 프레임 색(`#596543` 등)과 달라 하나를 골라야 했음
- 사각 체크박스 선택 상태는 원형(우유 목록)과 같은 금색 체크로 맞춤 — Figma에 사각 선택 상태가 없음

## 2026-11-12 협업 설정

- PR 댓글 답변은 GitHub Actions + Claude 구독 토큰(`CLAUDE_CODE_OAUTH_TOKEN`) — 댓글에 즉시 답하고 API 키 과금이 없음
- 상시 오픈 PR(#1)은 develop 변경을 자동 merge, 충돌 시 덮지 않고 댓글로 알림

## 미결 사항

- [ ] 화면 프레임 색 vs Design System 팔레트 중 정답 (디자이너 확인)
- [ ] Pretendard 폰트 로딩 (`index.html`에 없음)
