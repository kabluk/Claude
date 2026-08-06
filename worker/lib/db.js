// D1-доступ к таблице scans. Схема: migrations/0001_init.sql + 0002_error_code.sql.

export async function insertScanPending(db, { id, url, email, createdAt }) {
  await db
    .prepare(`INSERT INTO scans (id, url, status, email, created_at) VALUES (?, ?, 'running', ?, ?)`)
    .bind(id, url, email ?? null, createdAt)
    .run()
}

export async function completeScan(db, { id, pages, findings, score }) {
  await db
    .prepare(
      `UPDATE scans SET status = 'done', pages_json = ?, findings_json = ?, score = ?, completed_at = ? WHERE id = ?`
    )
    .bind(JSON.stringify(pages), JSON.stringify(findings), score, new Date().toISOString(), id)
    .run()
}

export async function failScan(db, { id, error, errorCode }) {
  await db
    .prepare(`UPDATE scans SET status = 'error', error = ?, error_code = ?, completed_at = ? WHERE id = ?`)
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
  }
}
