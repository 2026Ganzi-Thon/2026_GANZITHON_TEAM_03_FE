/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_TERMS_VERSION?: string
  readonly VITE_PRIVACY_VERSION?: string
  readonly VITE_MARKETING_VERSION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** 앱 빌드 id(vite.config.ts define) — 배포마다 바뀐다 */
declare const __APP_BUILD_ID__: string
