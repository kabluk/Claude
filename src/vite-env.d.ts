/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Origin Cloudflare Worker'а сканера (worker/, INTERFACES.md §2), напр.
  // https://accessatlas-worker.<account>.workers.dev — без завершающего слэша.
  // Без неё /scan и /report/:id рендерятся, но показывают понятное сообщение
  // «сканер сейчас недоступен» (ScannerUnavailableError) вместо падения сборки.
  readonly VITE_SCANNER_API?: string

  // Публичный site key Cloudflare Turnstile (не секрет — можно коммитить в build-
  // конфиг деплоя, в отличие от TURNSTILE_SECRET_KEY в Worker secrets). Без него
  // виджет не рендерится, скан отправляется без токена (сервер сам пропускает
  // проверку, если TURNSTILE_SECRET_KEY тоже не настроен — см. worker/lib/turnstile.js).
  readonly VITE_TURNSTILE_SITE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
