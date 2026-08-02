// Cloudflare Worker для detnav: отдаёт статику из dist/ и делает серверный
// редирект с корня по языку браузера (Accept-Language) на /en|es|ru/.
//
// В wrangler.jsonc стоит run_worker_first: ["/"] — этот воркер вызывается
// первым только для "/". Остальные пути Cloudflare отдаёт статикой напрямую,
// применяя dist/_headers (CSP с sha256-хэшами). Если язык не распознан —
// /en/. Запасной путь без сервера (dist/index.html, RootRedirect) остаётся.

const SUPPORTED = ['en', 'es', 'ru']

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/') {
      const header = request.headers.get('Accept-Language') || ''
      const prefs = header
        .split(',')
        .map((part) => part.split(';')[0].trim().slice(0, 2).toLowerCase())
        .filter(Boolean)
      const lang = prefs.find((p) => SUPPORTED.includes(p)) || 'en'
      return Response.redirect(`${url.origin}/${lang}/`, 302)
    }
    return env.ASSETS.fetch(request)
  },
}
