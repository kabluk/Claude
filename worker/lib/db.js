// D1-доступ к таблице scans. Схема: migrations/0001_init.sql + 0002_error_code.sql
// + 0007_scan_progress.sql (CN-SCAN-PHASES, D-067).

export async function insertScanPending(db, { id, url, email, createdAt }) {
  await db
    .prepare(`INSERT INTO scans (id, url, status, email, created_at) VALUES (?, ?, 'running', ?, ?)`)
    .bind(id, url, email ?? null, createdAt)
    .run()
}

// CN-SCAN-PHASES (D-067): промежуточный прогресс. Пишется ТОЛЬКО пока скан
// running — гейт в WHERE, чтобы запоздавшая запись прогресса никогда не ожила
// на уже завершённом скане. updatedAt — серверная метка, по ней UI может
// понять, что прогресс свежий, не веря часам клиента.
export async function updateScanProgress(db, { id, phase, pagesDone, pagesTotal }) {
  const progress = { phase, pagesDone, pagesTotal, updatedAt: new Date().toISOString() }
  await db
    .prepare(`UPDATE scans SET progress_json = ? WHERE id = ? AND status = 'running'`)
    .bind(JSON.stringify(progress), id)
    .run()
}

// A4-SITE-COUNTRY (migrations/0009_country.sql): country — the result of
// worker/lib/siteCountry.js::resolveCountry, {code, source}. Optional param
// (defaults to both-null) so callers/tests that predate this feature keep
// working without passing it — same backward-compat rubric as progress_json.
export async function completeScan(db, { id, pages, findings, score, country }) {
  await db
    .prepare(
      // Финал перезаписывает прогресс в NULL (D-067): у завершённого скана
      // промежуточного состояния нет по определению.
      `UPDATE scans SET status = 'done', pages_json = ?, findings_json = ?, score = ?, completed_at = ?, progress_json = NULL, country_code = ?, country_source = ? WHERE id = ?`
    )
    .bind(
      JSON.stringify(pages), JSON.stringify(findings), score, new Date().toISOString(),
      country?.code ?? null, country?.source ?? null, id,
    )
    .run()
}

export async function failScan(db, { id, error, errorCode }) {
  await db
    .prepare(`UPDATE scans SET status = 'error', error = ?, error_code = ?, completed_at = ?, progress_json = NULL WHERE id = ?`)
    .bind(String(error).slice(0, 500), errorCode, new Date().toISOString(), id)
    .run()
}

// D-109: второй рубеж против вечного `running`. Первый (сторож D-108) живёт
// ВНУТРИ изолята со сканом — и умирает вместе с ним: на проде скан, запущенный
// уже с работающим сторожем, всё равно застрял в `running` (изолят убит
// платформой, waitUntil-промис и таймер исчезли, failScan не записался).
// Этот UPDATE вызывается из КОРОТКОГО GET-запроса (handleGetScan) — судьба
// изолята со сканом на него не влияет.
// Гейт `AND status = 'running'` обязателен: между SELECT в getScan и этим
// UPDATE ещё живой (просто медленный) скан мог успеть записать done — жать
// его в error поверх готового результата нельзя. Возвращает, была ли строка
// реально закрыта именно этим вызовом.
export async function reapStaleScan(db, { id, error }) {
  const result = await db
    .prepare(
      `UPDATE scans SET status = 'error', error = ?, error_code = 'timeout', completed_at = ?, progress_json = NULL WHERE id = ? AND status = 'running'`
    )
    .bind(String(error).slice(0, 500), new Date().toISOString(), id)
    .run()
  return (result?.meta?.changes ?? 0) > 0
}

// A2-REPORT-PAYWALL: access rule for the PDF plan is "a lead was left for
// this scan_id" (migrations/0003_leads.sql already has scan_id + an index on
// it — the free branch of the funnel needed no schema change). Missing/falsy
// scanId returns false WITHOUT a query: handleGetScan (worker/routes/scan.js)
// calls this on every poll of a 'done' report, and an id-less lookup would
// either error or (worse) match every leads row with scan_id IS NULL.
export async function hasLeadForScan(db, scanId) {
  if (!scanId) return false
  const row = await db.prepare(`SELECT 1 FROM leads WHERE scan_id = ? LIMIT 1`).bind(scanId).first()
  return row != null
}

// A2-STRIPE-CHECKOUT: second unlock path for the PDF plan — a one-time €19.99
// Stripe payment (migrations/0008_plan_purchases.sql). Same falsy-guard rubric
// as hasLeadForScan: a missing/empty scanId returns false WITHOUT a query
// (an id-less SELECT would either error or match nothing usefully).
export async function hasPaidPlanForScan(db, scanId) {
  if (!scanId) return false
  const row = await db.prepare(`SELECT 1 FROM plan_purchases WHERE scan_id = ? LIMIT 1`).bind(scanId).first()
  return row != null
}

// A2-STRIPE-CHECKOUT: records a confirmed plan purchase. Idempotent — Stripe
// delivers webhooks at-least-once, so the SAME checkout.session.completed can
// arrive twice; ON CONFLICT(scan_id) DO UPDATE keeps exactly one row per scan
// and a repeat delivery neither throws nor duplicates. paid_at is the caller's
// SERVER timestamp (see stripeHook.js — never trusted from Stripe/the client),
// mirroring computeFeaturedUntil.
export async function recordPlanPurchase(db, { scanId, stripeRef, paidAt }) {
  await db
    .prepare(
      `INSERT INTO plan_purchases (scan_id, stripe_ref, paid_at) VALUES (?, ?, ?)
       ON CONFLICT(scan_id) DO UPDATE SET stripe_ref = excluded.stripe_ref, paid_at = excluded.paid_at`,
    )
    .bind(scanId, stripeRef ?? null, paidAt)
    .run()
}

// A2-STRIPE-CHECKOUT: the single access rule for the PDF plan — unlocked iff a
// lead was left for this scan (free branch of the funnel, HANDOFF "Воронка")
// OR the plan was paid for (Stripe Checkout). This is the ONE helper the gate
// (scanPdf.js) and withPlanUnlocked (scan.js) call — both used to call
// hasLeadForScan directly, now they get both paths for free.
// Short-circuits: a found lead skips the second query entirely (the free
// branch is the common case and worth more than €19.99, HANDOFF "Воронка").
export async function isPlanUnlocked(db, scanId) {
  if (await hasLeadForScan(db, scanId)) return true
  return hasPaidPlanForScan(db, scanId)
}

export async function getScan(db, id) {
  const row = await db.prepare(`SELECT * FROM scans WHERE id = ?`).bind(id).first()
  if (!row) return null
  return {
    id: row.id,
    url: row.url,
    status: row.status,
    pages: row.pages_json ? JSON.parse(row.pages_json) : [],
    findings: row.findings_json ? JSON.parse(row.findings_json) : [],
    score: row.score,
    error: row.error,
    errorCode: row.error_code,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    // D-067: null для старых строк, строк без колонки (до миграции 0007) и
    // завершённых сканов — обратная совместимость обязательна (D-064 fallback
    // в UI). SELECT * не падает на отсутствующей колонке — undefined → null.
    progress: row.progress_json ? JSON.parse(row.progress_json) : null,
    // A4-SITE-COUNTRY (migrations/0009_country.sql): null для строк до этой
    // миграции и для running/error сканов (country пишется только completeScan) —
    // тот же fallback-принцип, что у progress выше.
    countryCode: row.country_code ?? null,
    countrySource: row.country_source ?? null,
  }
}
