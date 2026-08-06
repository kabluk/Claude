// Классифицирует сырую ошибку сканирования в маленький enum, который фронтенд
// может превратить в понятный пользователю текст без парсинга стектрейсов
// (VISION.md UX-требование 4: своё сообщение на каждое состояние ошибки).
// Чистая функция — тестируется без Worker-окружения.

const PATTERNS = [
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
