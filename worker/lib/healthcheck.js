// R-HEALTH-CRON (D-188): ежедневный health-check прода из уже существующего
// worker-cron `0 3 * * *` (worker/index.js::scheduled) + письмо владельцу
// через Resend, но ТОЛЬКО на переходе состояния.
//
// ЧЕСТНАЯ ОГОВОРКА (dead man's switch — уже разобран в LEARNING_LOG
// 2026-08-16, см. запись под тем же названием): этот проход живёт ВНУТРИ
// того же Cron Trigger, что и вся проверяемая система. Если воркер вообще
// перестанет тикать (истёк CF-токен, кто-то случайно удалил Cron Trigger
// следующим `wrangler deploy`, заблокирован аккаунт) — этот модуль просто не
// выполнится, и тишина будет НЕОТЛИЧИМА от «всё хорошо». Узел закрывает
// класс «воркер тикает, но что-то из проверяемого сломано» — НЕ класс
// «воркер вообще перестал тикать». Второе требует наблюдателя СНАРУЖИ этой
// же цепочки (внешний heartbeat/uptime-сервис, которому воркер обязан
// отчитываться, а не наоборот) и сознательно не входит в этот узел.
//
// ЧТО ПРОВЕРЯЕТСЯ (4 проверки) и почему именно они:
//   1. home_page — env.ALLOWED_ORIGIN + '/' отдаёт 200 и содержит маркер
//      главной. То, что реально видит первый посетитель.
//   2. worker_scan_route — GET /api/scan/<заведомо несуществующий id> НА
//      ПУБЛИЧНОМ адресе воркера (env.WORKER_ORIGIN), настоящим fetch, а не
//      прямым вызовом handleGetScan в процессе. Это единственная из четырёх
//      проверок, что идёт по сети до воркера ровно так, как дошёл бы
//      реальный клиент — ловит протухший токен/DNS/снятый деплой. 404 —
//      это УСПЕХ (воркер поднялся, смаршрутизировал, дошёл до D1, ничего не
//      нашёл — ожидаемо для случайного uuid). Сам скан НЕ запускается (GET,
//      не POST) — Browser Rendering платный, health-check не имеет права
//      его трогать.
//   3. database — `SELECT 1` напрямую через env.DB, без HTTP. Отдельно от
//      проверки 2: та ловит «воркер+роутинг+D1» одним комком, эта одна
//      отличает «сломан именно D1» от «сломан только роут /api/scan» — то
//      есть решает, куда смотреть первым делом, читая письмо в 3 часа ночи.
//   4. report_shell — env.ALLOWED_ORIGIN + '/report/<id>' отдаёт 200 и
//      содержит маркер шелла (scripts/gen-a11y-sitemap.mjs). Отдельный код-
//      путь от главной: `/report/*` обслуживает Pages Function поверх
//      ASSETS (functions/report/[[path]].js, D-103), а не обычный
//      предсобранный SSG-файл — и именно на этот путь ведёт КАЖДЫЙ скан и
//      каждое письмо-дайджест. Сломайся именно он — обычная главная всё
//      равно будет отдавать 200 и ничего не поймает.
//
// Почему НЕ больше (не весь smoke-prod.mjs, 12 проверок): у деплоя уже есть
// свой гейт (R-SMOKE-DEPLOY) на ИМЕННО ЭТОТ момент риска — «сборка прошла,
// прод не тот». Этот узел — про другой момент риска: «между деплоями что-то
// протухло само» (токен, D1, домен, функция). Число агентств на главной,
// адрес воркера в живом бандле, sitemap.xml, 404 на несуществующем пути — всё
// это НЕ МЕНЯЕТСЯ без нового деплоя, и гонять их каждую ночь означало бы
// тратить сетевые вызовы на инварианты, которые физически не могут протухнуть
// сами по себе (а на деплое их уже проверяет R-SMOKE-DEPLOY). Здесь — именно
// то, что может сломаться БЕЗ деплоя. Никакого Browser Rendering и никакой
// SCAN_QUEUE — health-check не имеет права стоить денег.

import { sendEmail, VERIFIED_FROM } from './resend.js'

const TIMEOUT_MS = 10000
const USER_AGENT = 'VerscalaHealthCheck/1.0 (+https://verscala.com)'

// Тот же заведомо несуществующий uuid, что scripts/smoke-prod.mjs использует
// для своей проверки «воркер жив» — держать одним значением специально не
// стали (smoke-prod — node-скрипт вне воркера, отдельный рантайм), но смысл
// один и тот же: валидный формат id, который никогда не будет реальным сканом.
const PROBE_SCAN_ID = '00000000-0000-0000-0000-000000000000'

// Маркер главной — намеренно ТОТ ЖЕ текст, что уже проверяет smoke-prod.mjs
// (та же строка лендинга). Общий риск обоих гейтов честно назван уже там: если
// копирайтер поменяет этот текст, оба гейта ложно покраснеют одновременно —
// принятая цена за маркер, который не совпадает случайно с чем угодно на
// странице (просто "200 и не пусто" не ловит SPA-фоллбэк на чужую страницу).
const HOME_MARKER = 'Check your website'

// Маркер /report/:id — заголовок шелла (gen-a11y-sitemap.mjs шаг «заголовок»).
// Без em-dash: тот же символ пишется в файл напрямую, но сравнение по ASCII-
// подстроке устойчивее к любой возможной перекодировке символа '—' на пути
// диск -> HTTP -> fetch(), а отличить report-шелл от прочих 200-страниц
// подстрока "scan report" всё равно однозначно позволяет.
const REPORT_MARKER = 'scan report'

function resolveSiteOrigin(env) {
  const configured = env?.ALLOWED_ORIGIN
  if (typeof configured === 'string' && configured && configured !== '*') return configured.replace(/\/+$/, '')
  return null
}

const DEFAULT_WORKER_ORIGIN = 'https://accessatlas-worker.zincroom.workers.dev'
function resolveWorkerOrigin(env) {
  const configured = env?.WORKER_ORIGIN
  if (typeof configured === 'string' && configured && configured !== '*') return configured.replace(/\/+$/, '')
  return DEFAULT_WORKER_ORIGIN
}

async function fetchWithTimeout(url) {
  return fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'user-agent': USER_AGENT },
  })
}

async function checkHomePage(env) {
  const origin = resolveSiteOrigin(env)
  if (!origin) return { ok: false, detail: 'ALLOWED_ORIGIN is not configured' }
  try {
    const res = await fetchWithTimeout(`${origin}/`)
    if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}` }
    const body = await res.text()
    if (!body.includes(HOME_MARKER)) return { ok: false, detail: `200 but missing marker "${HOME_MARKER}"` }
    return { ok: true }
  } catch (err) {
    return { ok: false, detail: `request failed: ${err?.message ?? err}` }
  }
}

async function checkWorkerScanRoute(env) {
  const origin = resolveWorkerOrigin(env)
  try {
    const res = await fetchWithTimeout(`${origin}/api/scan/${PROBE_SCAN_ID}`)
    if (res.status !== 404) return { ok: false, detail: `HTTP ${res.status} (expected 404 for a nonexistent scan)` }
    return { ok: true }
  } catch (err) {
    return { ok: false, detail: `request failed: ${err?.message ?? err}` }
  }
}

async function checkDatabase(env) {
  if (!env?.DB) return { ok: false, detail: 'DB binding is missing' }
  try {
    const row = await env.DB.prepare('SELECT 1 AS ok').first()
    if (!row || Number(row.ok) !== 1) return { ok: false, detail: 'unexpected result from SELECT 1' }
    return { ok: true }
  } catch (err) {
    return { ok: false, detail: `query failed: ${err?.message ?? err}` }
  }
}

async function checkReportShell(env) {
  const origin = resolveSiteOrigin(env)
  if (!origin) return { ok: false, detail: 'ALLOWED_ORIGIN is not configured' }
  try {
    const res = await fetchWithTimeout(`${origin}/report/${PROBE_SCAN_ID}`)
    if (res.status !== 200) return { ok: false, detail: `HTTP ${res.status}` }
    const body = await res.text()
    if (!body.includes(REPORT_MARKER)) return { ok: false, detail: `200 but missing marker "${REPORT_MARKER}"` }
    return { ok: true }
  } catch (err) {
    return { ok: false, detail: `request failed: ${err?.message ?? err}` }
  }
}

// Порядок в этом массиве — порядок в письме, не порядок исполнения (все
// проверки идут параллельно через Promise.all ниже).
const CHECKS = [
  { name: 'home_page', run: checkHomePage },
  { name: 'worker_scan_route', run: checkWorkerScanRoute },
  { name: 'database', run: checkDatabase },
  { name: 'report_shell', run: checkReportShell },
]

// Экспортируется отдельно от runHealthCheck (которая ещё читает/пишет
// состояние и шлёт письма) — тот же приём, что selectDueSubscriptions в
// subscriptionCron.js: чистая функция «что сейчас видно» тестируется без
// необходимости гонять D1/Resend вокруг неё.
export async function runHealthChecks(env) {
  const results = await Promise.all(
    CHECKS.map(async ({ name, run }) => ({ name, ...(await run(env)) })),
  )
  const failures = results.filter((r) => !r.ok).map(({ name, detail }) => ({ name, detail }))
  return { status: failures.length === 0 ? 'ok' : 'down', failures }
}

export async function loadHealthState(db) {
  const row = await db
    .prepare(`SELECT status, alerted_status, updated_at, last_alert_sent_at FROM health_check_state WHERE id = 1`)
    .first()
  if (!row) return null
  return {
    status: row.status,
    alertedStatus: row.alerted_status ?? null,
    updatedAt: row.updated_at,
    lastAlertSentAt: row.last_alert_sent_at ?? null,
  }
}

export async function saveHealthState(db, { status, alertedStatus, failures, now, lastAlertSentAt }) {
  await db
    .prepare(
      `INSERT INTO health_check_state (id, status, alerted_status, updated_at, last_failures_json, last_alert_sent_at)
       VALUES (1, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         alerted_status = excluded.alerted_status,
         updated_at = excluded.updated_at,
         last_failures_json = excluded.last_failures_json,
         last_alert_sent_at = excluded.last_alert_sent_at`,
    )
    .bind(status, alertedStatus ?? null, now, failures.length ? JSON.stringify(failures) : null, lastAlertSentAt ?? null)
    .run()
}

// Edge-triggered, не level-triggered (LEARNING_LOG, термин дня этого узла):
// письмо реагирует на ПЕРЕХОД (alertedStatus -> status меняется), а не на
// текущее значение состояния каждый тик. `alertedStatus == null` (ни разу не
// подтверждённая отправка — первый тик вообще ИЛИ прошлый алерт не долетел)
// сознательно НЕ считается «было хорошо»: если прод сломан уже на самом первом
// тике этого узла, письмо всё равно должно уйти, а не молчать до случайного
// восстановления. Единственное, что подавляет письмо — предыдущий УСПЕШНО
// подтверждённый 'down'.
function decideAlertKind(alertedStatus, status) {
  if (status === 'down' && alertedStatus !== 'down') return 'down'
  if (status === 'ok' && alertedStatus === 'down') return 'recovered'
  return null
}

const OWNER_NOTIFY_EMAIL = 'info@verscala.com' // тот же адрес, что A2-LEAD-EMAIL (worker/routes/lead.js), не заводим второй

export function buildDownAlertEmail({ failures, checkedAt }) {
  const lines = failures.map((f) => `- ${f.name}: ${f.detail}`)
  const subject = `Verscala prod health check FAILED (${failures.length}/4)`
  const text = [
    `The daily production health check found a problem at ${checkedAt}.`,
    '',
    ...lines,
    '',
    'This is a one-time alert on the transition from healthy to broken — it will NOT repeat every night while this stays broken.',
    "You'll get a second email when it recovers.",
    '',
    "Note: this check runs from inside the same worker it is checking. If the worker stops ticking entirely (expired token, deleted cron trigger, blocked account), this email will not fire — silence is not a guarantee of health.",
  ].join('\n')
  return { subject, text }
}

export function buildRecoveredAlertEmail({ checkedAt }) {
  const subject = 'Verscala prod health check recovered'
  const text = `The daily production health check passed again at ${checkedAt}, after a previous failure.`
  return { subject, text }
}

// Best-effort (тот же паттерн, что sendDigestBestEffort/notifyOwnerBestEffort):
// отсутствие ключа или сбой Resend НЕ бросает. Возвращает true/false — вызывающий
// решает, двигать ли alertedStatus (см. runHealthCheck).
async function sendHealthAlertBestEffort(env, { subject, text }) {
  if (!env.RESEND_API_KEY) return false
  try {
    await sendEmail(env.RESEND_API_KEY, { from: VERIFIED_FROM, to: OWNER_NOTIFY_EMAIL, subject, text })
    return true
  } catch (err) {
    console.error(`R-HEALTH-CRON: failed to send alert email: ${err?.message ?? err}`)
    return false
  }
}

// Точка входа для worker/index.js::scheduled — четвёртый ОТДЕЛЬНЫЙ waitUntil,
// тот же принцип, что у retention/rescan/digest: НИКОГДА не бросает, падение
// здесь не имеет права утащить соседние задачи тика.
//
// Возвращает {status, failures, alert, alertSent, error?}.
export async function runHealthCheck(env, now = new Date()) {
  const nowIso = now.toISOString()
  const summary = { status: 'unknown', failures: [], alert: null, alertSent: false }

  if (!env?.DB) {
    console.error('R-HEALTH-CRON: no DB binding, cannot read/write health state — skipping this tick')
    return { ...summary, error: 'db_unavailable' }
  }

  const { status, failures } = await runHealthChecks(env)
  summary.status = status
  summary.failures = failures

  let previous = null
  try {
    previous = await loadHealthState(env.DB)
  } catch (err) {
    console.error(`R-HEALTH-CRON: failed to read previous health state: ${err?.message ?? err}`)
  }
  const alertedStatus = previous?.alertedStatus ?? null
  let nextAlertedStatus = alertedStatus
  let lastAlertSentAt = previous?.lastAlertSentAt ?? null

  const kind = decideAlertKind(alertedStatus, status)
  if (kind === 'down') {
    summary.alert = 'down'
    const { subject, text } = buildDownAlertEmail({ failures, checkedAt: nowIso })
    const sent = await sendHealthAlertBestEffort(env, { subject, text })
    summary.alertSent = sent
    if (sent) {
      nextAlertedStatus = 'down'
      lastAlertSentAt = nowIso
    }
    console.error(
      `R-HEALTH-CRON: status -> down (${failures.map((f) => f.name).join(', ')}), alert email ${sent ? 'sent' : 'NOT sent (will retry next tick)'}`,
    )
  } else if (kind === 'recovered') {
    summary.alert = 'recovered'
    const { subject, text } = buildRecoveredAlertEmail({ checkedAt: nowIso })
    const sent = await sendHealthAlertBestEffort(env, { subject, text })
    summary.alertSent = sent
    if (sent) {
      nextAlertedStatus = 'ok'
      lastAlertSentAt = nowIso
    }
    console.log(`R-HEALTH-CRON: status -> ok (recovered), recovery email ${sent ? 'sent' : 'NOT sent (will retry next tick)'}`)
  } else {
    // Первый ever tick в состоянии 'ok' тоже проходит сюда (alertedStatus
    // null, status 'ok' — не down, значит kind === null) — baseline тихо
    // записывается ниже, письма нет: не о чем сообщать.
    if (alertedStatus === null) nextAlertedStatus = status
    console.log(`R-HEALTH-CRON: status ${status} (alerted status was ${alertedStatus ?? 'none'}), no email`)
  }

  try {
    await saveHealthState(env.DB, { status, alertedStatus: nextAlertedStatus, failures, now: nowIso, lastAlertSentAt })
  } catch (err) {
    console.error(`R-HEALTH-CRON: failed to persist health state: ${err?.message ?? err}`)
  }

  return summary
}
