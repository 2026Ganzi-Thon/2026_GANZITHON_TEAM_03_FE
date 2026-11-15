import {
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

// 아이콘 원본(public/favicon.svg)이 이미 주색 바탕을 화면 끝까지 채우고 그림을 가운데 80% 안에 둔다.
// 그래서 여백을 더 넣지 않고, 둥근 모서리 바깥(maskable·iOS 아이콘)은 같은 주색으로 채운다.
const PRIMARY = '#59603b'

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0,
      resizeOptions: { background: PRIMARY },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0,
      resizeOptions: { background: PRIMARY },
    },
  },
  images: ['public/favicon.svg'],
})
