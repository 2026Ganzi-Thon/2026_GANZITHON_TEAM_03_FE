# CLAUDE.md

## 폴더 구조 (Feature-based)

```
src/
├─ app/        # 앱 설정 (라우터, Provider, 전역 스타일)
├─ pages/      # 라우트 화면 (기능 조립만)
├─ features/   # 기능별 폴더
├─ shared/     # 공용 UI, API 인스턴스, 유틸
├─ assets/     # 이미지, 일러스트
└─ main.tsx
```

### 0. 폴더별 역할

| 폴더 | 역할 | 예시 |
| --- | --- | --- |
| `app/` | 앱 전체에 한 번만 설정하는 것 | 라우터, QueryClient Provider, 전역 CSS, 색상·간격 변수 |
| `pages/` | 라우트 하나에 대응하는 화면. 기능을 배치만 한다 | `HomePage`, `CheesePage` |
| `features/` | 기능 하나에 필요한 UI, 로직, API, 타입을 한 폴더에 모은다 | `emotion/`, `cheese/`, `cave/` |
| `shared/` | 특정 기능에 속하지 않는 범용 코드 | Button, Modal, API 인스턴스, 날짜 유틸 |
| `assets/` | 정적 파일 | 양·섬 일러스트, 아이콘 |

### 규칙 1. 의존 방향은 한 방향만

```
app → pages → features → shared
```

- 화살표 방향으로만 import할 수 있다.
- 위쪽 폴더는 아래쪽 폴더를 쓸 수 있지만, 아래쪽 폴더는 위쪽을 쓸 수 없다.

### 규칙 2. 기능(feature)끼리는 서로 import하지 않는다

기능 A가 기능 B를 필요로 할 때,

1. **페이지에서 조합**
   - **(가장 먼저 고려)** 두 기능을 한 화면에 같이 보여줘야 하면, 페이지가 둘 다 가져와서 배치.
2. **공용으로 올리기**
   - 여러 기능이 같은 컴포넌트, 타입, 유틸을 쓰면 `shared/`로 옮기기.
     - 예: 감정 아이콘을 emotion과 cheese 둘 다 쓰면 `shared/`의 `EmotionIcon`으로 옮긴다.
3. **데이터는 props나 콜백으로 넘긴다**
   - 기능 A의 결과가 기능 B에 필요하면, 페이지가 A에서 값을 받아서 B에 props로 넘긴다.

### 규칙 3. 기능은 `index.ts`로만 밖에 공개한다

### 현재 프로젝트의 예시 폴더 구조

```
src/
├─ app/
│  ├─ App.tsx
│  └─ global.css             // 색상·간격 변수, 리셋
│
├─ pages/
│  ├─ HomePage.tsx
│  └─ CheesePage.tsx
│
├─ features/
│  └─ cheese/
│     ├─ CheeseCard.tsx
│     ├─ CheeseCard.module.css
│     ├─ cheeseApi.ts
│     └─ index.ts            // 치즈카드를 내보내는 것은 index.ts
│
├─ shared/
│  ├─ ui/
│  │  ├─ Button/
│  │  │  ├─ Button.tsx
│  │  │  ├─ Button.module.css
│  │  │  └─ index.ts
│  │  ├─ Modal/
│  │  │  ├─ Modal.tsx
│  │  │  ├─ Modal.module.css
│  │  │  └─ index.ts
│  │  └─ index.ts            // 공용 UI 모아서 내보내기
│  └─ api.ts
│
├─ assets/
└─ main.tsx
```

---

## 커밋 메시지 구조

```
타입(스코프): 제목 - 설명
```

아래와 같은 타입들을 사용한다.

| 타입 이름 | 내용 |
| --- | --- |
| feat | 새로운 기능에 대한 커밋 |
| fix | 버그 수정에 대한 커밋 |
| build | 빌드 관련 파일 수정 / 모듈 설치 또는 삭제에 대한 커밋 |
| chore | 그 외 자잘한 수정에 대한 커밋 |
| docs | 문서 수정에 대한 커밋 |
| style | 코드 스타일 혹은 포맷 등에 관한 커밋 |
| refactor | 코드 리팩토링에 대한 커밋 |
| test | 테스트 코드 수정에 대한 커밋 |
| perf | 성능 개선에 대한 커밋 |

**Body**는 Header에서 표현할 수 없는 **상세한 내용**을 적는다.
Header에서 충분히 표현할 수 있다면 **생략 가능**.

### 예시

```
간단하게 적기

git commit -m "feat: 로그인 기능 구현"
git commit -m "fix: 무한 로딩 오류 수정"
git commit -m "chore: 버튼 크기 변경"
git commit -m "docs: 문서 정리"

필요 시 자세히 적기

git commit -m "feat: 로그인 기능 구현 - (자세한 설명)"
git commit -m "docs: CLAUDE.md 문서 수정 - 어쩌고 저쩌고"
```

---

## 브랜치 (Git Flow 방식)

이슈 없이 브랜치 구조만 Git Flow를 따른다. PR은 선택이다.

| 브랜치 | 역할 | 출발 → 합치는 곳 |
| --- | --- | --- |
| `main` | 제출·배포용. 직접 커밋하지 않는다 | `develop`에서만 머지 |
| `develop` | 개발 통합. 직접 커밋하지 않는다 | `feature/*`를 머지 |
| `feature/이름` | 기능·화면 하나 (예: `feature/cheese-card`) | `develop` → `develop` |
| `hotfix/이름` | `main`의 긴급 수정 | `main` → `main`, `develop` 둘 다 |

```
git checkout develop && git pull origin develop
git checkout -b feature/cheese-card
# 작업, 커밋
git pull --rebase origin develop
git checkout develop && git merge --no-ff feature/cheese-card
git push origin develop
git branch -d feature/cheese-card
```

- 브랜치는 작게 만들고 빨리 `develop`에 합친다.
- PR은 자신 없을 때만 올린다(리뷰받고 싶을 때). 간단한 작업은 PR 없이 위처럼 바로 `develop`에 합친다.
- 합치기 전에 `develop`을 pull해서 충돌을 먼저 푼다.
- 커밋 메시지는 위의 `타입: 제목` 형식을 따른다.

---

## 참고 자료

- 디자인(Figma): https://www.figma.com/design/NuEcJA8MTLcgK09PLzsk8x/Arithon-3%ED%8C%80?node-id=0-1&p=f&m=dev
  - 페이지 `Main Product`, 모바일 393×852 기준. 화면 번호(0-0 스플래시 ~ 5 동굴 문 닫기, 섬꾸미기)는 프레임 이름을 따른다.
