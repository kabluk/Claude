// Cloudflare Pages Function для корня сайта.
// Серверный редирект по языку браузера (Accept-Language) на /en|es|ru/.
// Заменяет правило Netlify `_redirects` с условием Language= — его формат
// Cloudflare не поддерживает. По умолчанию /en/. Если функция когда-то
// не задеплоится (например, при загрузке одной статики), корень всё равно
// обслужит dist/index.html — там выбор языка ссылками и авто-редирект на JS.

const SUPPORTED = ['en', 'es', 'ru']

export function onRequest(context) {
  const url = new URL(context.request.url)
  const header = context.request.headers.get('Accept-Language') || ''
  const prefs = header
    .split(',')
    .map((part) => part.split(';')[0].trim().slice(0, 2).toLowerCase())
    .filter(Boolean)
  const lang = prefs.find((p) => SUPPORTED.includes(p)) || 'en'
  return Response.redirect(`${url.origin}/${lang}/`, 302)
}
