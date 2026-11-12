# 의사결정 기록

PR 댓글에 자동으로 답변하는 Claude(`.github/workflows/claude-pr-reply.yml`)가 근거로 삼는 문서입니다.
새로운 결정이 생기면 **날짜와 이유**를 같이 적어 주세요. 여기에 없는 내용은 Claude가 "기록에 없음"이라고 답합니다.

> 처음 작성: 2026-11-12, 공통 컴포넌트 작업 세션 기록을 Claude가 정리했습니다. 사실과 다른 부분은 담당자가 고쳐 주세요.

## 1. 공통 컴포넌트 (`src/shared/ui/`)

### 범위
- Figma 전체(Main Product / Design System 페이지)를 보고 **2곳 이상 반복되거나 앞으로 반복될 UI**만 공통 컴포넌트로 만들었다. 화면 전용 UI는 만들지 않았다.
- 만든 것(19종): Icon, IconButton, BackButton, Button, Field, TextField, TextArea, Select, Checkbox, Chip, Badge, WoolCounter, Header, TabBar, Tabs, Banner, ActionCard, PageIndicator, Modal.
- 화면(페이지)·기능(feature) 구현은 이 작업의 범위가 아니다.

### 일부러 만들지 않은 것과 이유
| 항목 | 이유 |
|---|---|
| 시간 선택 알약(05:00 / 10:00 / 15:00) | 동굴 화면 한 곳에서만 쓴다 |
| 우유 고민 카드(이미지·제목·본문·선택) | feature 성격이 강하다. 선택 동그라미는 `Checkbox shape="round"`로 대체 가능 |
| 치즈 보관함 배너(금색 바탕 + 장식 원) | 한 번만 나온다 |
| 먹이주기 기록 행 / 돌봄 행동 목록 행 | 두 행의 모양이 달라 하나로 묶기 어렵다 |
| "치즈 만들기 ———" 구분선 | 한 곳에서만 쓴다 |
| 섬 꾸미기 바텀시트·아이템 카드 | 한 화면 전용 |
| Google 로그인 버튼 | 한 곳에서만 쓴다 |
| 상태바·홈 인디케이터 | OS가 그리는 영역 |
| Button 로딩 상태 | Figma에 없다 |

### 구현 방침
- props는 최소한으로: `variant` / `size`, `children`, `className`, 나머지 네이티브 속성은 `...rest`로 전달. 네이티브 element 속성 타입을 상속한다.
- 접근성: 시맨틱 태그, 키보드 조작, focus-visible 링, 아이콘 전용 버튼은 `aria-label` 필수, 입력창은 label 연결.
- **Modal은 네이티브 `<dialog>`**를 쓴다. 포커스 이동·가두기, ESC, 배경 inert를 브라우저가 처리하기 때문이다. 배경 스크롤 잠금만 직접 구현했다. ESC·배경 클릭은 `onClose`만 부르고, `open` 상태 변경은 쓰는 쪽 몫이다.
- **Icon은 SVG mask 방식**이다. 아이콘 색을 `color`(currentColor)로 바꿀 수 있고, 새 아이콘 라이브러리를 추가하지 않았다. 새 아이콘은 `src/assets/icons/`에 SVG를 넣고 `Icon.tsx`의 `ICONS`에 한 줄 추가한다.
- **TabBar는 라우터에 의존하지 않는다.** 위치(fixed 등)와 이동은 쓰는 쪽에서 `onChange`로 처리한다.
- **Tabs**는 `role=tablist` + 방향키/Home/End 이동(roving tabindex)이다. 탭 패널 연결(`aria-controls`)은 쓰는 쪽에서 처리한다.
- 입력 컴포넌트(TextField / TextArea / Select)는 `Field`(라벨·hint·error 래퍼)를 공유한다. `error`가 있으면 `hint` 대신 오류 문구를 보여준다.
- 아이콘 SVG는 Figma 위치를 유지하도록 탭바 아이콘 5개를 26px 프레임으로 다시 감쌌다. 아이콘마다 ±1px 차이가 날 수 있다.

### 디자인 토큰
- 토큰은 `src/app/global.css`의 CSS 변수로 둔다. 컴포넌트는 하드코딩 값 대신 이 변수만 쓴다.
- **화면 프레임의 색과 Design System 페이지의 팔레트가 조금 다르다.** 화면에는 `#596543`, `#cda663`, `#f3ece0`, `#fffdfb`가, 팔레트에는 `#59603b`, `#d5ae60`, `#f7f3e8`, `#fffcf5`가 있다. 어느 쪽이 맞는지 몰라 **Design System 팔레트를 따랐다.** 회색 `#767676`과 `#d9d9d9`는 가장 가까운 gray-3, gray-5로 맞췄다. → 디자이너 확인 필요(미결).
- 선택된 체크박스의 디자인은 우유 목록(원형)에만 있다. 사각형도 같은 금색 테두리 + 체크로 맞췄다.
- Pretendard 폰트는 `global.css`에서 지정하지만 `index.html`에 로딩이 없어 실제로는 fallback 폰트가 보인다. 이번 범위 밖이라 건드리지 않았다. → 미결.

## 2. 협업 규칙 (`CLAUDE.md` 기준)
- 폴더 구조는 feature-based, 의존 방향은 `app → pages → features → shared` 한 방향이다. feature끼리는 서로 import하지 않는다. 공개는 `index.ts`로만.
- 브랜치는 Git Flow 방식: `main`/`develop`에는 직접 커밋하지 않고 `feature/*`에서 작업해 `develop`에 합친다. PR은 선택이다.
- 커밋 메시지는 `타입(스코프): 제목 - 설명` 형식이고, 컴포넌트 단위로 나눠 커밋한다.

## 3. 미결 사항
- [ ] Figma 화면 색상과 Design System 팔레트 중 어느 쪽이 맞는지(디자이너 확인)
- [ ] Pretendard 폰트 로딩 방식
- [ ] 체크박스 선택 상태·시간 선택 알약 등 Figma에 상태가 빠진 디자인 보완
