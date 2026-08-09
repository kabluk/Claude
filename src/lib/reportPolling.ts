// D-106: чистое решение «что делать после одной попытки опроса /report/:id».
// Вынесено из ReportPage.tsx, чтобы рискованную часть — терминальные состояния
// и переживание транзиентных сбоев — можно было проверить тестом, а не только
// глазами. Повод: на проде долгий скан (1–2 мин) падал в «Couldn't load this
// report» от ОДНОГО сетевого сбоя опроса, хотя скан на сервере продолжался и
// доходил до конца. Мобильная сеть за две минуты почти гарантированно даёт
// хотя бы один сбой запроса — опрос обязан их переживать.

// Статусы скана — ровно те, что пишет воркер (worker/lib/db.js): running при
// создании, затем done | error. Инлайним объединение, а не импортируем из
// scanner.ts: тот модуль читает import.meta.env на верхнем уровне и не
// импортируется в node-тест (та же причина, что у costEstimate до D-046).
export type ScanStatusLike = 'running' | 'done' | 'error'

export const POLL_INTERVAL_MS = 2500
// На сбое опрашиваем чуть реже штатного интервала — не долбим воркер в момент,
// когда сеть уже шатается.
export const POLL_ERROR_BACKOFF_MS = 4000
// Сколько сбоев ПОДРЯД терпим, прежде чем честно показать ошибку. Счётчик
// обнуляется любым успешным ответом, поэтому за длинный скан переживается
// сколько угодно ОТДЕЛЬНЫХ блипов — важна только серия подряд.
export const MAX_CONSECUTIVE_POLL_ERRORS = 4

// Итог одной попытки опроса, уже разобранный вызывающим кодом на 4 класса.
// 404 (fetchScan вернул null) и «сканер не настроен» (ScannerUnavailableError)
// — НЕ транзиентные: сами не пройдут, ретраить их бессмысленно и вредно
// (бесконечный опрос удалённого/несуществующего отчёта).
export type PollAttempt =
  | { kind: 'ok'; status: ScanStatusLike }
  | { kind: 'not-found' }
  | { kind: 'unavailable' }
  | { kind: 'transient-error' }

// Что показать и опрашивать ли дальше. `consecutiveErrors` возвращается там,
// где вызывающему нужно обновить свой счётчик; для терминальных исходов его
// нет — счётчик больше не нужен.
export type PollNext =
  | { show: 'report'; keepPolling: true; retryDelayMs: number; consecutiveErrors: 0 }
  | { show: 'report'; keepPolling: false }
  | { show: 'not-found' }
  | { show: 'unavailable' }
  | { show: 'retry'; delayMs: number; consecutiveErrors: number }
  | { show: 'load-error' }

export function decidePollNext(attempt: PollAttempt, consecutiveErrors: number): PollNext {
  switch (attempt.kind) {
    case 'ok':
      // running → показываем прогресс и продолжаем; успех обнуляет серию сбоев.
      // done/error → терминально, опрос прекращаем (отчёт/ошибка уже финальны).
      return attempt.status === 'running'
        ? { show: 'report', keepPolling: true, retryDelayMs: POLL_INTERVAL_MS, consecutiveErrors: 0 }
        : { show: 'report', keepPolling: false }
    case 'not-found':
      return { show: 'not-found' }
    case 'unavailable':
      return { show: 'unavailable' }
    case 'transient-error': {
      const next = consecutiveErrors + 1
      // Достигли предела серии — сдаёмся с честной ошибкой. Иначе НЕ трогаем
      // показанное (живой прогресс остаётся на экране) и пробуем снова.
      return next >= MAX_CONSECUTIVE_POLL_ERRORS
        ? { show: 'load-error' }
        : { show: 'retry', delayMs: POLL_ERROR_BACKOFF_MS, consecutiveErrors: next }
    }
  }
}
