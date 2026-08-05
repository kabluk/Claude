// Извлечение ссылок того же origin из HTML — чистая функция, тестируется без браузера.
// Используется axe.js, чтобы решить, какие страницы обойти после главной (R5: ≤6 страниц/скан).

export function sameOriginLinks(html, baseUrl, limit) {
  const origin = new URL(baseUrl).origin
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
  const out = []
  const seen = new Set([baseUrl])
  for (const href of hrefs) {
    let abs
    try {
      abs = new URL(href, baseUrl).toString()
    } catch {
      continue // относительная/битая ссылка — пропускаем, не валим скан
    }
    if (new URL(abs).origin !== origin) continue
    if (abs.includes('#')) continue
    if (seen.has(abs)) continue
    seen.add(abs)
    out.push(abs)
    if (out.length >= limit) break
  }
  return out
}
