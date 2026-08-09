// A1-REPORT-DIRECT-LINK / D-103: `/report/:id` — клиентский маршрут без
// статического файла (id сканов непредсказуем, за пределами getStaticPaths,
// src/routes.tsx). Прямой заход/переоткрытая ссылка отдавали 404: Cloudflare
// Pages включает SPA-фоллбек ТОЛЬКО когда в корне вывода нет `404.html` — а
// он у нас есть намеренно (конвенция хостингов, scripts/gen-a11y-sitemap.mjs),
// и он перехватывает неизвестные пути раньше `_redirects`. Два обходных пути
// уже проверены живьём и не работают (см. историю в git-блейме этого
// комментария): `_redirects` 200-rewrite на /index.html — 404.html имеет
// приоритет; отдать сам 404.html — приложение стартует, но не монтирует
// ReportPage (гидратация ждёт разметку страницы 404, а не отчёта).
//
// Pages Functions матчатся ДО статических ассетов — этот файл перехватывает
// весь /report/* раньше 404-фоллбека и отдаёт заранее собранный шелл
// (dist/report-shell.html, gen-a11y-sitemap.mjs) со статусом 200. В шелле
// снят атрибут data-server-rendered — клиентский вход vite-react-ssg
// (node_modules/vite-react-ssg/dist/index.mjs) проверяет его, чтобы выбрать
// hydrate() (ожидает совпадения с текущим URL — и ломается, как в проваленной
// попытке выше) или render() (независимый клиентский рендер с нуля по
// window.location — а он всегда настоящий /report/<id>).
export async function onRequest(context) {
  const shellUrl = new URL('/report-shell.html', context.request.url)
  const asset = await context.env.ASSETS.fetch(new Request(shellUrl, context.request))
  return new Response(asset.body, { status: 200, headers: asset.headers })
}
