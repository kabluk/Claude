// Детект ссылок на PDF — A3-PDF. PDF-документы в scope EAA/EN 301 549 (если сайт
// публикует их для выполнения своей функции — не архивные сканы), и почти всегда
// недоступны (не тегированы, нет структуры для screen reader). Тривиальная, но
// отсутствующая проверка: axe-core сам PDF не сканирует (он не HTML), поэтому
// без этой проверки находки о PDF просто не появляются вообще — молчаливый пробел,
// не false negative по конкретному правилу, а целая категория, которую скан не видит.
//
// Живая проверка (2026-08-06, bundesregierung.de/breg-de/service/publikationen):
// 44 реальных PDF-ссылки, часть с query-параметрами после расширения — типовой
// немецкий паттерн "datei.pdf?__blob=publicationFile&v=4" (регэксп должен захватывать
// ".pdf" ДО "?", не требовать его в конце строки). Известное ограничение: PDF без
// ".pdf" в URL вовсе (редиректящий download-эндпоинт без расширения в пути) этой
// проверкой не ловится — не встретилось в живых фикстурах, честно не заявляем
// поддержку, которую не проверяли.

export function detectPdfLinks(html, baseUrl) {
  const re = /href="([^"]+\.pdf(?:[?#][^"]*)?)"/gi
  const out = []
  const seen = new Set()
  let m
  while ((m = re.exec(html))) {
    let abs
    try {
      abs = baseUrl ? new URL(m[1], baseUrl).toString() : m[1]
    } catch {
      continue
    }
    if (seen.has(abs)) continue
    seen.add(abs)
    out.push(abs)
  }
  return out
}
