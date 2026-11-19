/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL; on Vercel "/api/graduateTracer" so the admin cookie stays same-site. */
  readonly VITE_API_URL?: string;
  /** "true" only in the sample-data preview (`npm run preview:demo`). */
  readonly VITE_MOCK_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
