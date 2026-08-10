// Классифицирует сырую ошибку сканирования в маленький enum, который фронтенд
// может превратить в понятный пользователю текст без парсинга стектрейсов
// (VISION.md UX-требование 4: своё сообщение на каждое состояние ошибки).
// Чистая функция — тестируется без Worker-окружения.

const PATTERNS = [
  // A1-SCAN-BUSY-RETRY: платформа Browser Rendering занята — у НАС ничего не
  // сломано и с сайтом пользователя всё в порядке. Прод 2026-08-10 отдал
  // дословно: `Unable to create new browser: code: 429: message: Rate limit
  // exceeded` (лимиты аккаунта: новые браузеры в единицу времени + потолок
  // параллельных сессий). Раньше это падало в 'internal' — то есть врало
  // пользователю «что-то сломалось у нас».
  //
  // Стоит ПЕРВЫМ намеренно: сообщение содержит и `429`, и слова, которые
  // будущие паттерны могут захотеть себе; порядок фиксирует, кто выигрывает.
  //
  // Почему НЕ голый /429/: код 429 встречается в URL сканируемого сайта
  // (`https://example.com/page429`), который попадает в текст ошибки почти
  // любого отказа навигации, — такой матч уводил бы честный 'unreachable' в
  // 'busy'. Поэтому 429 матчится только вместе со своим префиксом `code:`.
  // Почему НЕ отдельные `Rate limit exceeded` / `Too Many Requests`: так
  // отвечает и сам сканируемый сайт, когда лимитирует НАС, а это по смыслу
  // 'blocked', а не «наш сканер занят» — соврать тут дороже, чем не поймать.
  { code: 'busy', re: /Unable to create new browser|code:\s*429|Too many (?:concurrent |active )?browser sessions|browser session limit/i },
  { code: 'unreachable', re: /ERR_NAME_NOT_RESOLVED|ENOTFOUND|ERR_ADDRESS_UNREACHABLE/ },
  { code: 'refused', re: /ERR_CONNECTION_REFUSED|ECONNREFUSED|ERR_CONNECTION_RESET/ },
  { code: 'tls', re: /ERR_CERT|CERT_AUTHORITY_INVALID|SSL|TLS handshake/ },
  { code: 'timeout', re: /timeout|Timeout|ETIMEDOUT/ },
  { code: 'blocked', re: /ERR_BLOCKED_BY_CLIENT|403|robots/i },
]

export function classifyError(rawMessage) {
  const message = String(rawMessage || '')
  for (const { code, re } of PATTERNS) {
    if (re.test(message)) return code
  }
  return 'internal'
}
