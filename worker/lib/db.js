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

export async function completeScan(db, { id, pages, findings, score }) {
  await db
    .prepare(
      // Финал перезаписывает прогресс в NULL (D-067): у завершённого скана
      // промежуточного состояния нет по определению.
      `UPDATE scans SET status = 'done', pages_json = ?, findings_json = ?, score = ?, completed_at = ?, progress_json = NULL WHERE id = ?`
    )
    .bind(JSON.stringify(pages), JSON.stringify(findings), score, new Date().toISOString(), id)
    .run()
}

export async function failScan(db, { id, error, errorCode }) {
  await db
    .prepare(`UPDATE scans SET status = 'error', error = ?, error_code = ?, completed_at = ?, progress_json = NULL WHERE id = ?`)
    .bind(String(error).slice(0, 500), errorCode, new Date().toISOString(), id)
    .run()
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
  }
}
