// A3-CRON-RESCAN-DELTA (D-135): еженедельный ре-скан подписанных URL.
//
// Вызывается из worker/index.js::scheduled — из ТОГО ЖЕ Cron Trigger
// `0 3 * * *`, что и retention (deleteExpiredScans). Второй элемент
// triggers.crons НЕ добавлен, и это осознанный выбор узла (D-135 оставил его
// исполнителю):
//   * тик нужен ЕЖЕДНЕВНЫЙ, а cadence — недельная. Подписка становится «due»
//     через 7 дней после СВОЕГО последнего ре-скана, а подписываются люди в
//     произвольные дни. Один недельный cron (`0 3 * * 1`) сканировал бы всех
//     разом по понедельникам: и задержка до 6 дней у только что подписавшегося,
//     и залп из всех подписок в одну ночь при max_concurrency=2 у Browser
//     Rendering. Ежедневный тик + фильтр «прошло ли 7 дней» на КАЖДОЙ строке
//     даёт ровно недельную периодичность на подписчика и размазывает нагрузку.
//   * второе расписание пришлось бы разводить по event.cron, то есть добавить
//     ветвление ради двух вызовов, которые и так дешёвы и независимы.
//
// Сам скан здесь НЕ выполняется: в очередь `SCAN_QUEUE` кладётся ровно такое же
// сообщение, что кладёт POST /api/scan (buildScanJobMessage), и его разбирает
// тот же консьюмер (worker/lib/scanJob.js). Никакого второго браузерного пути
// (D-135: «новый браузерный путь не создаётся»).

import { insertScanPending, failScan, getScan } from './db.js'
import { buildScanJobMessage } from './scanJob.js'
import { computeScanDelta, isEmptyDelta } from './scanDelta.js'
import { sendEmail, VERIFIED_FROM } from './resend.js'

// Единственная cadence на MVP. Колонка `cadence` в таблице есть
// (0010_subscriptions.sql), но пишется в неё только 'weekly'
// (worker/routes/subscribe.js::insertSubscription), поэтому cutoff считается
// ОДИН на всю выборку, а не по строке.
// Если появится вторая cadence (daily/monthly) — выборку придётся переделать:
// один cutoff на всех начнёт врать. Чтобы это не уехало молча, есть гейт-тест
// (subscriptionCron.test.mjs), который парсит миграцию и subscribe.js и падает,
// как только в них появляется значение, отличное от 'weekly'. Тот же приём, что
// у MAX_DELIVERIES vs wrangler.jsonc в scanJob.test.mjs.
export const SUPPORTED_CADENCES = { weekly: 7 }
export const DEFAULT_CADENCE = 'weekly'

// Потолок ре-сканов на один тик. Каждый ре-скан — оплаченный запуск Browser
// Rendering, и «100 подписок = 100 сканов в 3 часа ночи» это счёт, а не
// функция. Остаток не теряется: тик ежедневный, ORDER BY отдаёт самые давние
// первыми, и завтра они окажутся в начале очереди.
export const MAX_RESCANS_PER_TICK = 25

const DAY_MS = 24 * 60 * 60 * 1000

export function cadenceCutoffIso(now = new Date(), cadence = DEFAULT_CADENCE) {
  const days = SUPPORTED_CADENCES[cadence] ?? SUPPORTED_CADENCES[DEFAULT_CADENCE]
  return new Date(now.getTime() - days * DAY_MS).toISOString()
}

// ЧТО СЧИТАЕТСЯ «когда был последний ре-скан».
//
// В `subscriptions` нет колонки вроде `last_rescan_at` — есть только
// `last_scan_id` (0010_subscriptions.sql). Добавлять миграцию ради метки
// времени не нужно: метка уже есть в связанном скане. Берём `scans.created_at`
// — момент, когда ре-скан был ПОСТАВЛЕН (эту же строку вставляет
// insertScanPending ниже), а НЕ `completed_at`:
//   * `completed_at` у ещё выполняющегося скана NULL, и строка с NULL
//     неотличима от «никогда не сканировали» → подписка попадала бы в выборку
//     снова следующей же ночью, пока прошлый скан ещё идёт;
//   * вопрос, на который отвечает фильтр, — «тратили ли мы Browser Rendering
//     на этот URL в текущем окне», а не «получили ли мы результат». Ответ на
//     него даёт момент ПОСТАНОВКИ, и он одинаков для успешного, упавшего и
//     зависшего скана.
// LEFT JOIN, а не INNER: скан старше RETENTION_DAYS удаляется retention'ом
// (D-019) и `last_scan_id` повисает на несуществующей строке — это по смыслу
// «данных о прошлом скане нет», то есть подписку надо сканировать (90 дней
// retention заведомо больше 7 дней cadence, так что лишних сканов это не даёт).
//
// NULL сортируется первым через COALESCE(..., '') — любая ISO-строка больше
// пустой, значит «никогда не сканированные» встают в начало и не вытесняются
// лимитом.
const DUE_SUBSCRIPTIONS_SQL = `
  SELECT s.id AS id, s.email AS email, s.url AS url, s.cadence AS cadence,
         s.last_scan_id AS last_scan_id, sc.created_at AS last_scan_at
    FROM subscriptions s
    LEFT JOIN scans sc ON sc.id = s.last_scan_id
   WHERE s.verified = 1
     AND s.status = 'active'
     AND (sc.created_at IS NULL OR sc.created_at < ?)
   ORDER BY COALESCE(sc.created_at, '') ASC
   LIMIT ?`

// Возвращает [{id, email, url, cadence, lastScanId, lastScanAt}] — подписки,
// которым ре-скан положен ИМЕННО СЕЙЧАС. Отдельная экспортируемая функция,
// чтобы этот SQL можно было прогнать по настоящему SQLite на настоящей схеме
// (subscriptionCron.sql.test.mjs) — фейковый D1 на регулярках согласован с
// автором SQL по построению и такой гейт не ловит.
export async function selectDueSubscriptions(db, now = new Date(), limit = MAX_RESCANS_PER_TICK) {
  const { results } = await db
    .prepare(DUE_SUBSCRIPTIONS_SQL)
    .bind(cadenceCutoffIso(now), limit)
    .all()
  return (results ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    url: row.url,
    cadence: row.cadence ?? DEFAULT_CADENCE,
    lastScanId: row.last_scan_id ?? null,
    lastScanAt: row.last_scan_at ?? null,
  }))
}

// КОГДА обновляется last_scan_id: сразу после успешной постановки в очередь,
// а НЕ после завершения скана. Обоснование:
//   * скан асинхронный и завершится в консьюмере через минуты — до тех пор
//     подписка оставалась бы «никогда не сканированной» и попадала бы в
//     выборку каждую ночь, пока скан не завершится (а если он упал — навсегда,
//     то есть ежедневный залп Browser Rendering по сломанному сайту);
//   * консьюмер (worker/lib/scanJob.js) ничего не знает про подписки и знать не
//     должен: он обрабатывает джобы всех источников одинаково. Обновлять
//     подписку оттуда — значит завести обратную связь очередь → подписки ради
//     метки времени, которая уже есть в scans.created_at.
// Цена решения названа честно: если ре-скан упадёт (сайт лёг, Browser Rendering
// занят), эта неделя пройдёт без свежих данных, и следующая попытка будет через
// 7 дней. Для недельного мониторинга это приемлемо; ежедневные повторы по
// падающему сайту — нет.
async function setLastScanId(db, { subscriptionId, scanId }) {
  await db
    .prepare(`UPDATE subscriptions SET last_scan_id = ? WHERE id = ? AND status = 'active'`)
    .bind(scanId, subscriptionId)
    .run()
}

function hostOf(url) {
  try {
    return new URL(url).host
  } catch {
    return 'unparseable'
  }
}

// Один ре-скан = ровно тот же путь, что POST /api/scan:
//   insertScanPending (строка 'running', created_at = сейчас — от неё считает
//   протухание реап D-109) → SCAN_QUEUE.send(buildScanJobMessage(...)).
// Отличия от роута ровно два и оба намеренные:
//   * email в строку scans НЕ пишется. Адрес подписчика уже лежит в
//     subscriptions, и дублировать его в каждую еженедельную строку scans —
//     это размножение персональных данных без единого потребителя
//     (минимизация, RISKS R6 / D-019).
//   * countryCode нет: у подписки нет страны (в схеме такой колонки нет),
//     юрисдикция определится по TLD, как и для скана без override (D-032).
async function enqueueRescan(env, sub, now) {
  const scanId = crypto.randomUUID()

  await insertScanPending(env.DB, {
    id: scanId,
    url: sub.url,
    email: null,
    createdAt: now.toISOString(),
  })

  try {
    await env.SCAN_QUEUE.send(buildScanJobMessage({ id: scanId, url: sub.url, countryCode: null }))
  } catch (err) {
    // Строка уже вставлена, а джоба не будет — закрываем её сами, ровно как
    // роут POST /api/scan, иначе она провисит `running` до реапа D-109, который
    // на cron-скан никто не позовёт (реап срабатывает на GET, а этот скан
    // никто не читает).
    const message = err?.message ?? String(err)
    await failScan(env.DB, { id: scanId, error: `re-scan enqueue failed: ${message}`, errorCode: 'internal' })
    throw err
  }

  await setLastScanId(env.DB, { subscriptionId: sub.id, scanId })
  return scanId
}

// Точка входа для worker/index.js::scheduled.
//
// НИКОГДА не бросает: этот вызов живёт в одном тике с retention (D-019), и
// падение ре-скана не имеет права утащить за собой зачистку. Все ошибки
// логируются и попадают в возвращаемую сводку (её же читают тесты).
//
// Возвращает {due, enqueued, failed, pairs, error?}, где
//   pairs = [{subscriptionId, email, url, previousScanId, scanId}]
export async function runSubscriptionRescans(env, now = new Date()) {
  const summary = { due: 0, enqueued: 0, failed: 0, pairs: [] }

  if (!env?.DB) {
    console.error('A3-CRON-RESCAN: no DB binding, skipping re-scans')
    return { ...summary, error: 'db_unavailable' }
  }

  // Тот же громкий отказ, что в POST /api/scan (D-110): без producer-биндинга
  // мы НЕ откатываемся ни на какой обходной путь. Молчаливый обход вернул бы
  // ровно тот класс поломки, ради которого сделана очередь.
  if (!env.SCAN_QUEUE?.send) {
    console.error('A3-CRON-RESCAN: SCAN_QUEUE binding is missing, no re-scans enqueued')
    return { ...summary, error: 'queue_unavailable' }
  }

  let due
  try {
    due = await selectDueSubscriptions(env.DB, now)
  } catch (err) {
    console.error(`A3-CRON-RESCAN: due-subscription query failed: ${err?.message ?? err}`)
    return { ...summary, error: 'query_failed' }
  }

  summary.due = due.length
  if (due.length === 0) {
    console.log('A3-CRON-RESCAN: no subscriptions due for a re-scan')
    return summary
  }

  for (const sub of due) {
    // Незнакомая cadence не выкидывается из выборки (иначе такая подписка
    // молча перестала бы сканироваться навсегда) — она обрабатывается как
    // weekly, то есть в сторону РЕЖЕ, а не чаще, и о ней громко пишется в лог.
    if (!Object.hasOwn(SUPPORTED_CADENCES, sub.cadence)) {
      console.warn(
        `A3-CRON-RESCAN: subscription ${sub.id} has unsupported cadence "${sub.cadence}", treated as ${DEFAULT_CADENCE}`,
      )
    }

    try {
      const scanId = await enqueueRescan(env, sub, now)
      summary.enqueued += 1
      summary.pairs.push({
        subscriptionId: sub.id,
        email: sub.email,
        url: sub.url,
        previousScanId: sub.lastScanId,
        scanId,
      })
      // В лог — публичный id подписки и хост, без email и без token (тот же
      // рубеж, что logNewSubscription в worker/routes/subscribe.js).
      console.log(
        `A3-CRON-RESCAN: subscription ${sub.id} re-scan queued (${hostOf(sub.url)}), scan ${scanId}, previous ${sub.lastScanId ?? 'none'}`,
      )
    } catch (err) {
      // Одна упавшая подписка не отменяет остальные: их сканы независимы.
      summary.failed += 1
      console.error(`A3-CRON-RESCAN: subscription ${sub.id} re-scan failed: ${err?.message ?? err}`)
    }
  }

  // Дайджест-письмо отсюда НЕ уходит и уйти не может: `scanId` в этот момент
  // ещё `running` (скан выполнится в консьюмере через минуты). Его шлёт
  // ОТДЕЛЬНЫЙ проход runSubscriptionDigests (ниже), запускаемый следующими
  // тиками уже по ЗАВЕРШЁННЫМ ре-сканам. Архитектурный долг «пара сканов не
  // переживает тик» решён колонкой `last_digest_scan_id` (migrations/0011,
  // D-137), а НЕ правкой этого enqueue-пути — см. шапку миграции.
  console.log(
    `A3-CRON-RESCAN: due=${summary.due} enqueued=${summary.enqueued} failed=${summary.failed}` +
      (summary.due >= MAX_RESCANS_PER_TICK ? ` (hit MAX_RESCANS_PER_TICK=${MAX_RESCANS_PER_TICK}, rest continues tomorrow)` : ''),
  )

  return summary
}

// ===========================================================================
// A3-CRON-DIGEST-EMAIL (D-137): письмо-дайджест с дельтой двух сканов.
//
// Запускается ОТДЕЛЬНЫМ проходом от ре-скана (см. runSubscriptionRescans выше):
// ре-скан кладёт скан в очередь и завершается позже в консьюмере, поэтому в тик
// постановки дельты ещё нет. Дайджест смотрит на подписки, чей `last_scan_id`
// уже `done`, и сравнивает его с `last_digest_scan_id` — сканом, о котором
// подписчику писали в ПРОШЛЫЙ раз (migrations/0011). «Что изменилось с прошлого
// письма», а не «между двумя соседними ре-сканами»: это переживает упавший
// промежуточный ре-скан и рестарт воркера.
// ===========================================================================

// Потолок писем за тик — тот же порядок, что MAX_RESCANS_PER_TICK. За тик
// завершается не больше ре-сканов, чем их поставили (≤25), так что практически
// это страховка от внезапного всплеска, а не рабочее ограничение. Остаток —
// следующей ночью (ORDER BY completed_at ASC отдаёт дольше всех ждавших первыми).
export const MAX_DIGESTS_PER_TICK = 25

// Кандидаты на дайджест: verified+active подписка, чей новейший скан
// (`last_scan_id`) ЗАВЕРШЁН и ещё НЕ отражён в отправленном дайджесте
// (`last_digest_scan_id != last_scan_id`). JOIN, а не LEFT JOIN: без завершённого
// нового скана письмо строить не из чего. Сравнение с scans по PK (SEARCH).
const DUE_DIGESTS_SQL = `
  SELECT s.id AS id, s.email AS email, s.url AS url, s.token AS token,
         s.last_scan_id AS last_scan_id, s.last_digest_scan_id AS last_digest_scan_id
    FROM subscriptions s
    JOIN scans cur ON cur.id = s.last_scan_id
   WHERE s.verified = 1
     AND s.status = 'active'
     AND cur.status = 'done'
     AND (s.last_digest_scan_id IS NULL OR s.last_digest_scan_id != s.last_scan_id)
   ORDER BY cur.completed_at ASC
   LIMIT ?`

// Экспортируется отдельно, чтобы прогнать SQL по настоящему SQLite
// (subscriptionCron.sql.test.mjs), как selectDueSubscriptions.
export async function selectDueDigests(db, limit = MAX_DIGESTS_PER_TICK) {
  const { results } = await db.prepare(DUE_DIGESTS_SQL).bind(limit).all()
  return (results ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    url: row.url,
    token: row.token,
    lastScanId: row.last_scan_id ?? null,
    lastDigestScanId: row.last_digest_scan_id ?? null,
  }))
}

// Продвигает маркер «дайджест по этому скану обработан». Гейт по status='active'
// — тот же рубеж, что setLastScanId: подписку, отписавшуюся между выборкой и
// этим UPDATE, не трогаем.
async function setLastDigestScanId(db, { subscriptionId, scanId }) {
  await db
    .prepare(`UPDATE subscriptions SET last_digest_scan_id = ? WHERE id = ? AND status = 'active'`)
    .bind(scanId, subscriptionId)
    .run()
}

// origin для ссылок письма. У cron НЕТ запроса (в отличие от confirm-письма,
// берущего origin из request.url), поэтому единственный источник —
// env.ALLOWED_ORIGIN (боевой домен, wrangler.jsonc vars; тот же выбор, что
// planCheckout.js::resolveSiteOrigin). '*' — не адрес, значит «не настроено».
// Без валидного origin ссылки письма (report, unsubscribe) вели бы в никуда, а
// письмо без рабочей unsubscribe-ссылки нарушает verify-критерий узла и RFC 8058
// — поэтому дайджест-проход тогда честно не шлёт ничего (см. runSubscriptionDigests).
function resolveSiteOrigin(env) {
  const configured = env?.ALLOWED_ORIGIN
  if (typeof configured === 'string' && configured && configured !== '*') return configured.replace(/\/+$/, '')
  return null
}

// Минимальное HTML-экранирование — та же функция, что subscribe.js::escapeHtml
// (url подписчика попадает и в текст, и в href="..."). Держим локальную копию,
// а не общий импорт: escapeHtml в subscribe.js не экспортируется, а тащить его
// в export ради письма расширило бы контракт роут-модуля.
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function hostForSubject(url) {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

// Человекочитаемая строка изменения score со знаком-направлением. score в этом
// проекте «больше = лучше» (score.js), поэтому рост — это улучшение.
function scoreLine(delta) {
  const dir = delta.scoreChange > 0 ? 'improved' : delta.scoreChange < 0 ? 'declined' : 'unchanged'
  return `Accessibility score ${dir}: ${delta.scoreBefore} → ${delta.scoreAfter} (out of 100).`
}

// Чистый билдер письма — экспортируется и тестируется отдельно (как
// subscribe.js::buildConfirmEmail): по одной и той же дельте один и тот же текст,
// заголовки и ссылки. `scanId` — id ТЕКУЩЕГО (нового) скана, на его /report
// ведёт письмо. Возвращает {subject, text, html, headers}.
export function buildDigestEmail({ url, scanId, token, origin, delta }) {
  const host = hostForSubject(url)
  const reportUrl = `${origin}/report/${encodeURIComponent(scanId)}`
  const unsubscribeUrl = `${origin}/api/subscribe/unsubscribe?token=${encodeURIComponent(token)}`

  const newCount = delta.new.length
  const resolvedCount = delta.resolved.length
  const scopedOut = delta.scopedOutPages.length

  const summaryLines = [
    `${newCount} new ${newCount === 1 ? 'issue' : 'issues'} detected.`,
    `${resolvedCount} ${resolvedCount === 1 ? 'issue' : 'issues'} resolved.`,
    scoreLine(delta),
  ]
  if (scopedOut > 0) {
    // Честно называем страницы, которые в этот раз не обошли (плавающий набор
    // pickPriorityLinks), а не выдаём их за изменения — та же оговорка, что в
    // scanDelta.js::pageScope.
    summaryLines.push(`(${scopedOut} ${scopedOut === 1 ? 'page was' : 'pages were'} not crawled this time and were excluded from the comparison.)`)
  }

  const subject = `Your Verscala accessibility monitoring update for ${host}`

  const text = `Here's what changed on ${url} since your last Verscala monitoring update.

${summaryLines.join('\n')}

Full report: ${reportUrl}

You're receiving this because you subscribed to weekly accessibility monitoring for this site.
Unsubscribe: ${unsubscribeUrl}`

  const html = `<p>Here's what changed on <strong>${escapeHtml(url)}</strong> since your last Verscala monitoring update.</p>
<ul>
<li>${newCount} new ${newCount === 1 ? 'issue' : 'issues'} detected.</li>
<li>${resolvedCount} ${resolvedCount === 1 ? 'issue' : 'issues'} resolved.</li>
<li>${escapeHtml(scoreLine(delta))}</li>
${scopedOut > 0 ? `<li>${scopedOut} ${scopedOut === 1 ? 'page was' : 'pages were'} not crawled this time and were excluded from the comparison.</li>` : ''}
</ul>
<p><a href="${escapeHtml(reportUrl)}">View the full report</a></p>
<p style="color:#666;font-size:12px">You're receiving this because you subscribed to weekly accessibility monitoring for this site. <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a>.</p>`

  // RFC 8058 one-click unsubscribe: List-Unsubscribe несёт ту же ссылку, а
  // List-Unsubscribe-Post разрешает почтовому клиенту отписать POST'ом без
  // открытия страницы — POST-ветку принимает уже готовый handleUnsubscribe.
  const headers = {
    'List-Unsubscribe': `<${unsubscribeUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }

  return { subject, text, html, headers }
}

// Best-effort отправка (D-024, тот же паттерн, что sendConfirmEmailBestEffort):
// отсутствие ключа или ошибка Resend НЕ бросает и НЕ роняет проход. Возвращает
// true/false для лога и учёта в сводке.
async function sendDigestBestEffort(env, { email, url, scanId, token, origin, delta }) {
  if (!env.RESEND_API_KEY) return false
  const { subject, text, html, headers } = buildDigestEmail({ url, scanId, token, origin, delta })
  try {
    await sendEmail(env.RESEND_API_KEY, { from: VERIFIED_FROM, to: email, subject, text, html, headers })
    return true
  } catch (err) {
    console.error(`A3-CRON-DIGEST: failed to send digest for ${hostOf(url)}: ${err?.message ?? err}`)
    return false
  }
}

// Точка входа для worker/index.js::scheduled — соседний с retention и ре-сканом
// проход. НИКОГДА не бросает: живёт в одном тике с ними, падение не имеет права
// утащить соседей. Все ошибки логируются и попадают в сводку.
//
// Возвращает {candidates, sent, skippedEmpty, baseline, failed, error?}.
export async function runSubscriptionDigests(env, now = new Date()) {
  const summary = { candidates: 0, sent: 0, skippedEmpty: 0, baseline: 0, failed: 0 }

  if (!env?.DB) {
    console.error('A3-CRON-DIGEST: no DB binding, skipping digests')
    return { ...summary, error: 'db_unavailable' }
  }

  const origin = resolveSiteOrigin(env)
  if (!origin) {
    // Без боевого origin письмо получило бы нерабочие report/unsubscribe-ссылки.
    // Молча слать такое нельзя (нарушит unsubscribe-инвариант RFC 8058), поэтому
    // проход громко не делает НИЧЕГО — маркеры не двигаются, кандидаты дождутся
    // тика с настроенным ALLOWED_ORIGIN.
    console.error('A3-CRON-DIGEST: ALLOWED_ORIGIN is not configured, cannot build working links; no digests sent')
    return { ...summary, error: 'origin_unavailable' }
  }

  let due
  try {
    due = await selectDueDigests(env.DB)
  } catch (err) {
    console.error(`A3-CRON-DIGEST: due-digest query failed: ${err?.message ?? err}`)
    return { ...summary, error: 'query_failed' }
  }

  summary.candidates = due.length
  if (due.length === 0) {
    console.log('A3-CRON-DIGEST: no completed re-scans awaiting a digest')
    return summary
  }

  for (const sub of due) {
    try {
      const curr = await getScan(env.DB, sub.lastScanId)
      // SQL уже гейтит status='done', но getScan мог вернуть null, если скан
      // удалён retention'ом между выборкой и чтением — тогда сравнивать нечем.
      if (!curr || curr.status !== 'done') continue

      // previousScanId === null: первый завершённый ре-скан подписки (или прошлый
      // удалён retention'ом) — базовая линия, сравнивать не с чем, письма нет.
      let delta = null
      if (sub.lastDigestScanId) {
        const prev = await getScan(env.DB, sub.lastDigestScanId)
        if (prev && prev.status === 'done') {
          // Третий аргумент {previousPages, currentPages} ОБЯЗАТЕЛЕН: набор
          // обойдённых страниц плавает (pickPriorityLinks), без page-scope письмо
          // отчиталось бы о десятках изменений на сменившейся шапке сайта.
          delta = computeScanDelta(prev.findings, curr.findings, {
            previousPages: prev.pages,
            currentPages: curr.pages,
          })
        }
      }

      if (!delta) {
        summary.baseline += 1
        await setLastDigestScanId(env.DB, { subscriptionId: sub.id, scanId: sub.lastScanId })
        console.log(`A3-CRON-DIGEST: subscription ${sub.id} baseline recorded (${hostOf(sub.url)}), no email`)
        continue
      }

      // «Письмо не шлём на нулевой дельте» (verify-критерий) — предикат из
      // scanDelta.js, не переписанный здесь заново.
      if (isEmptyDelta(delta)) {
        summary.skippedEmpty += 1
        await setLastDigestScanId(env.DB, { subscriptionId: sub.id, scanId: sub.lastScanId })
        console.log(`A3-CRON-DIGEST: subscription ${sub.id} unchanged (${hostOf(sub.url)}), no email`)
        continue
      }

      const emailSent = await sendDigestBestEffort(env, {
        email: sub.email,
        url: sub.url,
        scanId: sub.lastScanId,
        token: sub.token,
        origin,
        delta,
      })

      if (emailSent) {
        // Маркер двигаем ТОЛЬКО при успешной отправке: транзиентный сбой Resend
        // тогда просто перешлётся следующим тиком (дайджест — продукт, терять его
        // из-за минутного сбоя хуже, чем письмо на день позже). После успеха
        // маркер == last_scan_id, и повторов до следующего ре-скана нет.
        summary.sent += 1
        await setLastDigestScanId(env.DB, { subscriptionId: sub.id, scanId: sub.lastScanId })
        console.log(`A3-CRON-DIGEST: subscription ${sub.id} digest sent (${hostOf(sub.url)}), scan ${sub.lastScanId}, +${delta.new.length}/-${delta.resolved.length} score ${delta.scoreChange >= 0 ? '+' : ''}${delta.scoreChange}`)
      } else {
        summary.failed += 1
        console.error(`A3-CRON-DIGEST: subscription ${sub.id} digest NOT sent (${hostOf(sub.url)}) — will retry next tick`)
      }
    } catch (err) {
      // Один упавший подписчик не срывает остальных: маркер не сдвинут, кандидат
      // вернётся следующим тиком.
      summary.failed += 1
      console.error(`A3-CRON-DIGEST: subscription ${sub.id} digest failed: ${err?.message ?? err}`)
    }
  }

  console.log(
    `A3-CRON-DIGEST: candidates=${summary.candidates} sent=${summary.sent} empty=${summary.skippedEmpty} baseline=${summary.baseline} failed=${summary.failed}`,
  )
  return summary
}
