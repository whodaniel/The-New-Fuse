/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_CDN_URL: string
  readonly VITE_BASE_PATH: string
  readonly VITE_HOST: string
  readonly VITE_PORT: string
  readonly VITE_PREVIEW_PORT: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}