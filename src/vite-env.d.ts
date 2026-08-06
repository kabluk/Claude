/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Origin Cloudflare Worker'а сканера (worker/, INTERFACES.md §2), напр.
  // https://accessatlas-worker.<account>.workers.dev — без завершающего слэша.
  // Без неё /scan и /report/:id рендерятся, но показывают понятное сообщение
  // «сканер сейчас недоступен» (ScannerUnavailableError) вместо падения сборки.
  readonly VITE_SCANNER_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
