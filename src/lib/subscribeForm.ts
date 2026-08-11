// A3-CRON-SUBSCRIBE-FORM (D-135): логика формы подписки на еженедельный
// мониторинг с /report/:id. Структура файла — по образцу leadForm.ts
// (чистая валидация + типы черновика отдельно от компонента), но с ОДНИМ
// принципиальным отличием: узел писался, когда `POST /api/subscribe` ещё не
// существовал, и требовал форму-заглушку без сетевых вызовов. К моменту
// старта узла бэкенд закрыт целиком (A3-CRON-SUBSCRIBE-API +
// A3-CRON-CONFIRM-EMAIL), поэтому submit подключён к настоящему эндпоинту,
// а не к TODO-заглушке: заглушка сейчас была бы враньём в обратную сторону.
//
// Контракт — INTERFACES.md §2: `POST /api/subscribe {email, url,
// turnstileToken?}` -> `201 {subscriptionId}` · `400 bad_request` ·
// `403 forbidden` (Turnstile) · `429 rate_limited`. Подписка создаётся в
// статусе pending и НЕ активна, пока подписчик не откроет ссылку из письма
// (double opt-in) — UI обязан говорить об этом, а не рисовать «готово».

import { ScannerUnavailableError, apiFetch, isValidScanUrl } from './scanner'

export type SubscribeFormValues = { email: string; url: string }
export type SubscribeFormErrors = Partial<Record<'email' | 'url', string>>

// Тот же намеренно нестрогий паттерн, что leadForm.ts::EMAIL_RE и
// worker/routes/subscribe.js::EMAIL_RE. Строже он быть не должен: настоящая
// проверка адреса — это переход по verify-ссылке, а не регулярка. Копия, а не
// общий импорт, по той же причине, что jurisdictions.ts копирует
// jurisdiction.js (D-010): воркер — plain ESM без общего модуля с фронтендом,
// а тащить фронтендовый leadForm.ts в подписку означало бы связать две
// несвязанные формы одной правкой.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// `url` НЕ вводится руками: он приходит из отчёта, который пользователь уже
// открыл. Валидируем его всё равно — тем же критерием, что воркер
// (isValidScanUrl == worker/routes/subscribe.js::isHttpUrl), чтобы форма не
// отправляла заведомо 400-й запрос и не показывала пользователю ошибку про
// поле, которого он не видит.
export function canMonitorUrl(url: string): boolean {
  const trimmed = url.trim()
  return !!trimmed && isValidScanUrl(trimmed)
}

export function validateSubscribeForm(
  values: SubscribeFormValues,
): { valid: true; value: SubscribeFormValues } | { valid: false; errors: SubscribeFormErrors } {
  const errors: SubscribeFormErrors = {}

  const email = values.email.trim()
  if (!email || !EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address — that’s where the confirmation link goes.'
  }

  const url = values.url.trim()
  if (!canMonitorUrl(url)) {
    errors.url = 'We can’t monitor this address.'
  }

  if (Object.keys(errors).length > 0) return { valid: false, errors }
  return { valid: true, value: { email, url } }
}

// Исходы отправки. Ни один из них не пробрасывает наружу текст ошибки сервера
// и не показывает код: сообщение выбирается ниже по коду (VISION.md
// UX-требование 4, тот же принцип, что scanErrorMessage в scanner.ts).
export type SubscribeErrorCode =
  | 'bad_request'
  | 'forbidden'
  | 'rate_limited'
  | 'server'
  | 'network'
  | 'unavailable'

export type SubscribeResult =
  | { kind: 'ok'; subscriptionId: string | null }
  | { kind: 'failed'; code: SubscribeErrorCode }

// Response -> исход, чистая функция ради тестируемости без живого воркера
// (тот же приём, что interpretCheckoutResponse в scanner.ts).
//
// Решение принимается по HTTP-статусу, а не по полю `code` тела: статус —
// это контракт INTERFACES.md §2, а тело может прийти от промежуточного прокси
// вообще без нашего JSON.
//
// 2xx без разбираемого `subscriptionId` — всё равно успех (subscriptionId:
// null). Подписка на этом статусе уже записана в D1 и письмо уже отправлено;
// сказать «не получилось» из-за формы тела означало бы толкнуть человека на
// повторную отправку и вторую строку подписки (дедупа на сервере намеренно
// нет). Сам id в UI не показывается — он не нужен пользователю.
export async function interpretSubscribeResponse(res: Response): Promise<SubscribeResult> {
  if (res.ok) {
    const data = (await res.json().catch(() => ({}))) as { subscriptionId?: unknown }
    return {
      kind: 'ok',
      subscriptionId: typeof data.subscriptionId === 'string' && data.subscriptionId ? data.subscriptionId : null,
    }
  }
  if (res.status === 400) return { kind: 'failed', code: 'bad_request' }
  if (res.status === 403) return { kind: 'failed', code: 'forbidden' }
  if (res.status === 429) return { kind: 'failed', code: 'rate_limited' }
  return { kind: 'failed', code: 'server' }
}

// Человеческий текст под каждый исход — без кодов, без статусов, без сырого
// сообщения сервера (D-013/D-105: тексты сразу на английском, языке продукта).
// Каждая строка говорит, что делать дальше: ошибка не должна быть тупиком (§38).
const ERROR_MESSAGES: Record<SubscribeErrorCode, string> = {
  bad_request: 'That email address wasn’t accepted. Check it for typos and try again.',
  forbidden:
    'We couldn’t confirm you’re not a bot. Reload the page and try once more — that usually resets the check.',
  rate_limited:
    'Too many sign-ups from your connection in the last hour. Wait an hour and try again, or use a different network.',
  server: 'Something went wrong on our side. Nothing was set up — please try again in a few minutes.',
  network:
    'We couldn’t reach our server. Check your connection and try again — nothing was set up.',
  unavailable: 'Monitoring isn’t connected on this deployment yet, so we can’t set it up right now.',
}

export function subscribeErrorMessage(code: SubscribeErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.server
}

// Тот же origin (VITE_SCANNER_API) и тот же нормализатор хвостовых слэшей
// (D-104), что у всех остальных вызовов воркера — apiFetch из scanner.ts,
// а не второй собственный API_BASE рядом.
//
// Никогда не бросает: любой сбой становится `failed` с кодом, для которого
// выше есть человеческий текст. Компонент формы не должен уметь обрабатывать
// исключения, чтобы «тихо ничего не произошло» стало невозможным.
export async function submitSubscription(input: {
  email: string
  url: string
  turnstileToken?: string
}): Promise<SubscribeResult> {
  try {
    const res = await apiFetch('/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: input.email,
        url: input.url,
        ...(input.turnstileToken ? { turnstileToken: input.turnstileToken } : {}),
      }),
    })
    return await interpretSubscribeResponse(res)
  } catch (err) {
    if (err instanceof ScannerUnavailableError) return { kind: 'failed', code: 'unavailable' }
    return { kind: 'failed', code: 'network' }
  }
}
