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

## 브랜치

Git Flow 방식의 브랜치만 사용한다. 이슈는 없고, PR은 선택이다.

- `main`: 제출·배포용 (직접 커밋 금지)
- `develop`: 개발 통합 (직접 커밋 금지)
- `feature/이름`: 기능·화면 하나. `develop`에서 만들어 `develop`에 합친다.
- `hotfix/이름`: `main`의 긴급 수정. `main`과 `develop` 둘 다에 합친다.

```bash
git checkout develop && git pull origin develop
git checkout -b feature/cheese-card
# 작업, 커밋
git pull --rebase origin develop
git checkout develop && git merge --no-ff feature/cheese-card
git push origin develop
git branch -d feature/cheese-card
```

- 커밋 메시지는 `타입: 제목` 형식 (자세한 규칙은 `CLAUDE.md`)
- 브랜치는 작게 만들고 빨리 합친다.
- PR은 자신 없을 때만 올린다(리뷰받고 싶을 때). 간단한 작업은 PR 없이 바로 `develop`에 합친다.
