/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the 9Th-Grade AI API, e.g. http://localhost:3001/api */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
