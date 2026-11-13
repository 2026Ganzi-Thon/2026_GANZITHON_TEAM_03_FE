# 홈 이미지 미리 받기 (온보딩 담당자용)

온보딩 화면이 떠 있는 동안 홈의 큰 이미지를 뒤에서 미리 받아 두면, 온보딩이 끝나고 홈에 들어갔을 때 섬 그림이 바로 보인다. 홈 쪽 함수는 만들어 두었으니 온보딩 화면에서 **한 번 불러 주기만** 하면 된다.

## 어떻게 쓰나

온보딩 페이지(`pages/`)에서 화면이 처음 그려질 때 호출한다.

```tsx
import { useEffect } from 'react'
import { preloadHomeAssets } from '@/features/home'

export default function OnboardingPage() {
  useEffect(() => {
    preloadHomeAssets()
  }, [])

  // ...온보딩 이미지·화면
}
```

- 온보딩 **첫 화면**에서 부르는 것을 권장한다. 온보딩 이미지가 뜨고 사용자가 넘겨 보는 동안 받아지기 때문이다.
- 여러 번 불러도 한 번만 받는다(안전). 화면 그리기를 막지 않는다.
- 온보딩 이미지 자체를 먼저 보여 주고 싶다면 온보딩 이미지가 로드된 뒤(`onLoad`)에 부르면 된다.

## 규칙

- `pages/` 에서 `@/features/home` 의 `index.ts` 로만 가져온다(`app → pages → features → shared`).
- **온보딩 feature 안에서 홈 feature를 import 하면 안 된다**(feature끼리 import 금지). 호출은 반드시 페이지에서 한다.
- 받는 대상은 홈의 섬 일러스트(`island@2x.png`, 약 400KB) 하나다. 더 필요한 이미지가 생기면 `src/features/home/preloadHomeAssets.ts` 의 목록에 홈 담당이 추가한다.

## 참고

- PWA 서비스 워커가 `png`/`svg` 를 미리 캐시하므로 두 번째 방문부터는 이미 캐시돼 있다. 이 함수는 **처음 설치·방문**에서 효과가 크다.
- 아이콘(설정·섬 꾸미기 등)과 제목 모서리 SVG는 작아서 빌드할 때 코드에 인라인되므로 대상이 아니다.
