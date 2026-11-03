# 2026 GANZITHON TEAM 03 FE

React + TypeScript + Vite

## 시작하기

```bash
npm install
cp .env.example .env
npm run dev
```

## 폴더 구조

```
src/
├─ app/        # 앱 설정 (App.tsx, global.css)
├─ pages/      # 라우트 화면
├─ features/   # 기능별 폴더
├─ shared/     # 공용 UI, API, 유틸
├─ assets/     # 이미지
└─ main.tsx
```

경로 별칭: `@` → `src` (예: `import { Button } from '@/shared/ui'`)

## 규칙

1. import 방향은 `app → pages → features → shared` 한 방향만 허용한다.
2. 기능끼리는 서로 import하지 않는다. 필요하면 `pages`에서 조합하거나 `shared`로 옮긴다.
3. 기능 폴더는 `index.ts`로만 외부에 공개한다.
4. 기능 폴더 안에는 하위 폴더를 만들지 않는다.
5. 공용 UI는 `shared/ui/컴포넌트명/` 폴더로 묶고, `shared/ui/index.ts`에서 모아 export한다.
6. 스타일은 컴포넌트 옆 `*.module.css`에 작성하고, 색상·간격은 `global.css`의 CSS 변수를 사용한다.

## 작업 흐름

기능 하나를 개발할 때 아래 순서를 따른다.

### 1. 이슈 열기

GitHub **Issues → New issue**에서 템플릿을 고른다.

- 기능이면 **기능 개발** (`feat: 제목`)
- 버그면 **버그 수정** (`fix: 제목`)

만들어진 이슈 번호를 기억해 둔다. (예: `#12`)

### 2. 브랜치 만들기

항상 최신 `develop`에서 출발한다.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/12-cheese-card
```

- 기능: `feature/이슈번호-이름`
- 버그: `fix/이슈번호-이름`

### 3. 작업하고 커밋하기

```bash
git add .
git commit -m "feat: 치즈 카드 목록 화면 구현"
git push -u origin feature/12-cheese-card
```

- 커밋 메시지는 `타입: 제목` 형식 (자세한 규칙은 `CLAUDE.md`)
- 진행하면서 이슈의 할 일 체크박스를 하나씩 체크한다.

### 4. PR 만들기

1. GitHub에서 **Compare & pull request**를 누른다.
2. ⚠️ **base 브랜치를 `develop`으로 바꾼다.** (기본값이 `main`이라 꼭 바꿔야 함)
3. 오른쪽 사이드바 **Development**에서 작업한 이슈를 선택해 연결한다.
4. 팀원에게 리뷰를 요청한다.

### 5. 머지하고 마무리

1. 리뷰가 끝나면 **Merge**한다.
2. 머지된 브랜치는 **Delete branch**로 삭제한다.
3. ⚠️ **이슈를 직접 닫는다.** (`develop` 머지로는 자동으로 닫히지 않음)

### 요약

```
이슈 열기 → develop에서 브랜치 → 커밋·푸시 → PR(base: develop, 이슈 연결) → 머지 → 이슈 닫기
```

> `main`, `develop`에는 직접 커밋하지 않는다. 항상 브랜치를 만들고 PR로 합친다.
