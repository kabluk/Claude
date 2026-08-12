// A3-CRON-MONITORING-PAGES (D-139): клиентская логика брендовых страниц
// подтверждения (/monitoring/confirm) и отписки (/monitoring/unsubscribe).
//
// Повод — прод-инцидент: verify-ссылка из письма вела прямо на JSON-эндпоинт
// воркера (`${worker}/api/subscribe/verify?token=…`). Пользователь получал
// сырой JSON (браузер предлагал скачать `verify.json`) на ЧУЖОМ домене
// `*.workers.dev` — и то и другое подрывает доверие. Теперь письма ведут на
// страницы САЙТА (verscala.com), а эти страницы client-side зовут тот же
// JSON-API — тем же путём (apiFetch из scanner.ts), что и все прочие формы.
//
// Контракт эндпоинтов (INTERFACES.md §2, НЕ меняется — он лишь получил нового
// потребителя, страницу вместо человека):
//   GET /api/subscribe/verify?token=      -> 200 {subscriptionId,url,verified,status}
//                                            · 400 без token · 404 not_found
//   GET|POST /api/subscribe/unsubscribe?token= -> 200 {…,url,status:'unsubscribed',
//                                            alreadyUnsubscribed} · 404 not_found
//
// Структура — по образцу subscribeForm.ts: чистый интерпретатор ответа отдельно
// от сетевого вызова, чтобы тестировать исход без живого воркера (API_BASE в
// tsx-тестах пуст, поэтому apiFetch там не запускается — тот же приём, что у
// interpretCheckoutResponse/interpretSubscribeResponse в scanner.ts).

import { ScannerUnavailableError, apiFetch } from './scanner'

// Причина неуспеха — код, а НЕ текст сервера и НЕ HTTP-статус (VISION.md
// UX-требование 4, тот же принцип, что scanErrorMessage/subscribeErrorMessage).
// Человеческий текст выбирается страницей: у confirm и unsubscribe он разный.
export type MonitoringErrorReason =
  | 'not-found' // 404 — неизвестный/просроченный токен (или чужой)
  | 'bad-request' // 400 — токена нет/битый (страница ловит «нет токена» раньше сети)
  | 'server' // прочий не-2xx — сбой на нашей стороне
  | 'network' // fetch бросил — сети/воркера нет
  | 'unavailable' // VITE_SCANNER_API не задан на этом деплое

export type MonitoringResult =
  | { kind: 'ok'; url: string | null }
  | { kind: 'error'; reason: MonitoringErrorReason }

// Response -> исход. Чистая функция ради тестируемости без живого воркера.
// Решение принимается по HTTP-статусу (контракт INTERFACES.md §2), а не по полю
// `code` тела: тело может прийти от промежуточного прокси вообще без нашего JSON.
//
// `url` из 2xx-тела — то, ЧТО мониторится/отписывается — показывается человеку.
// Его отсутствие (2xx без разбираемого url) не делает исход ошибкой: действие
// уже совершено на сервере, страница просто покажет сообщение без адреса.
export async function interpretMonitoringResponse(res: Response): Promise<MonitoringResult> {
  if (res.ok) {
    const data = (await res.json().catch(() => ({}))) as { url?: unknown }
    return { kind: 'ok', url: typeof data.url === 'string' && data.url ? data.url : null }
  }
  if (res.status === 404) return { kind: 'error', reason: 'not-found' }
  if (res.status === 400) return { kind: 'error', reason: 'bad-request' }
  return { kind: 'error', reason: 'server' }
}

// Общий раннер: собирает путь, бьёт в воркер тем же apiFetch, что и все формы,
// и НИКОГДА не бросает — любой сбой становится `error` с кодом, для которого у
// страницы есть человеческий текст (то же, что submitSubscription).
async function runMonitoringAction(path: string, token: string): Promise<MonitoringResult> {
  try {
    const res = await apiFetch(`${path}?token=${encodeURIComponent(token)}`)
    return await interpretMonitoringResponse(res)
  } catch (err) {
    if (err instanceof ScannerUnavailableError) return { kind: 'error', reason: 'unavailable' }
    return { kind: 'error', reason: 'network' }
  }
}

// GET /api/subscribe/verify — подтверждение double opt-in (pending -> active).
export function confirmMonitoring(token: string): Promise<MonitoringResult> {
  return runMonitoringAction('/api/subscribe/verify', token)
}

// GET /api/subscribe/unsubscribe — остановка мониторинга. Идемпотентна на
// сервере (повтор = тот же 200 с alreadyUnsubscribed:true), поэтому для страницы
// повторный клик — такой же success, а не ошибка.
export function unsubscribeMonitoring(token: string): Promise<MonitoringResult> {
  return runMonitoringAction('/api/subscribe/unsubscribe', token)
}
