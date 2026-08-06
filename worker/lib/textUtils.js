// Общие текстовые утилиты для юридических детекторов (statement.js, feedback.js,
// pdf.js) — вынесено, чтобы не дублировать normalize() в каждом модуле (A3-*, 2026-08-06).

export function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // снимаем диакритику
    .replace(/[’‘]/g, "'") // типографский апостроф -> обычный
    .toLowerCase()
    .trim()
}

// Извлекает <a href="...">текст</a> пары из HTML — упрощённый парсинг без DOM,
// но с текстом ссылки (нужен для матчинга по видимому тексту, не по href).
export function extractAnchors(html) {
  const out = []
  const re = /<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
  let m
  while ((m = re.exec(html))) {
    const href = m[1]
    const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    out.push({ href, text })
  }
  return out
}
