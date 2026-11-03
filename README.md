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
