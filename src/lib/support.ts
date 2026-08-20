// Ссылка «Поддержать» (Stripe Payment Link). Пока пустая строка — блок
// на странице организаций не показывается. Чтобы включить: вставьте сюда
// ссылку вида https://donate.stripe.com/... и пересоберите.
// Оплата целиком на stripe.com — на сайте не появляется ни форм, ни скриптов
// (Zero-Data не нарушается).
export const SUPPORT_URL = ''

// Pay-what-you-want за «Порядок действий» (Stripe Payment Link с включённым
// «Customers choose what to pay»). Пока пусто — блок «поддержать» рядом со
// скачиванием не показывается. Скачивание бесплатно всегда.
//
// Ссылка нужна ОДНА на все языки: название товара в Stripe не переводится,
// поэтому делаем его нейтральным («DETNAV · detnav.com»), а интерфейс
// страницы оплаты Stripe локализует сам — pwywFor() добавляет ?locale=,
// чтобы он совпал с языком страницы, с которой пришёл человек.
export const PWYW_URL: string = ''

export const pwywFor = (lang: 'en' | 'es' | 'ru'): string =>
  PWYW_URL ? `${PWYW_URL}${PWYW_URL.includes('?') ? '&' : '?'}locale=${lang}` : ''
