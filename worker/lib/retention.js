// Удаление старых сканов из D1 (R6 в RISKS.md: без этого таблица scans растёт
// бессрочно и держит IP-косвенные данные и email (если передан) дольше, чем
// нужно продукту — минимизация данных, не юридическая консультация). Окно —
// продуктовое решение, не платный ресурс и не деплой, approval владельца не
// требуется; см. D-019 для обоснования и как его поменять.
export const RETENTION_DAYS = 90

export function cutoffIso(now = new Date(), days = RETENTION_DAYS) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
}

// Строгое "<", не "<=": скан ровно на границе окна ещё жив ещё один прогон.
export async function deleteExpiredScans(db, now = new Date()) {
  const cutoff = cutoffIso(now)
  const result = await db.prepare(`DELETE FROM scans WHERE created_at < ?`).bind(cutoff).run()
  return { deleted: result.meta?.changes ?? 0, cutoff }
}
