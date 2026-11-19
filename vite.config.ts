import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // 앱 빌드 id — 서버 데이터 캐시 저장본(app/queryPersist.ts)의 buster. Vercel 은 커밋 해시, 그 밖에는 빌드 시각
  define: {
    __APP_BUILD_ID__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || Date.now().toString(36)),
  },
  // API 는 같은 출처(/api)로 부르고 개발 서버가 백엔드로 넘긴다 — 배포는 vercel.json 의 rewrites 가 같은 일을 한다.
  // 같은 출처여야 iPhone Safari(다른 사이트 쿠키 차단)에서도 로그인 쿠키(Refresh·구글 challenge)가 저장된다
  server: {
    proxy: { '/api': { target: 'https://3.38.62.168', changeOrigin: true } },
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: '폴리의 섬',
        short_name: '폴리의 섬',
        description: '오늘의 감정을 남기고 위로를 나누는 나만의 섬',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // 상태바는 화면 배경(--color-bg), 앱을 여는 동안의 바탕은 스플래시와 같은 주색(--color-primary)
        theme_color: '#fffcf5',
        background_color: '#59603b',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,woff2}'],
        navigateFallback: '/index.html',
        // API 는 Vercel 이 백엔드로 넘긴다(vercel.json) — 서비스 워커가 index.html 로 가로채지 않게
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: { enabled: true },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
