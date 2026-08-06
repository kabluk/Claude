// Извлечение ссылок того же origin из HTML — чистая функция, тестируется без браузера.
// Используется axe.js, чтобы решить, какие страницы обойти после главной (R5: ≤6 страниц/скан).

import { extractAnchors } from './textUtils.js'

// БАГ, найденный живой проверкой при работе над A3-PAGESELECT (2026-08-06, manufactum.de):
// прежняя реализация матчила href="..." ЛЮБОГО тега, не только <a> — на реальном сайте
// это ловило <link rel="preload" href="...woff2">, favicon-ссылки из <head> и т.п.
// Первые 5 "страниц" реального скана оказывались шрифтами/иконками, не HTML-страницами
// сайта — сканер тратил весь бюджет (MAX_PAGES) впустую на нескачиваемый-как-страница
// ресурс. Не входило в буквальный scope A3-PAGESELECT, но найдено при том же живом
// прогоне и исправлено тем же коммитом (тот же прецедент, что A2-CLAIM-API/D-023) —
// затрагивает оба экспорта модуля, поэтому extractAnchors (только <a>) вынесен в
// textUtils.js и используется обоими.
export function sameOriginLinks(html, baseUrl, limit) {
  const origin = new URL(baseUrl).origin
  const out = []
  const seen = new Set([baseUrl])
  for (const { href } of extractAnchors(html)) {
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

// A3-PAGESELECT: приоритизация транзакционных страниц (корзина, вход, форма) над
// первыми N ссылок в DOM-порядке. Жалобы и надзор (MLBF/DE) бьют именно по этим
// потокам — EAA прямо называет e-commerce; страница "О нас", которая случайно
// оказалась 3-й ссылкой в шапке, юридически куда менее значима.
//
// Живая проверка (2026-08-06, manufactum.de): ссылка на корзину — /warenkorb с
// видимым текстом "0,00 €" (просто сумма, БЕЗ слова "корзина"/"warenkorb" в тексте!) —
// поэтому ключевые слова матчатся и по href, и по тексту ссылки, не только по тексту
// (первая версия на одном тексте эту ссылку бы не нашла).
const PRIORITY_KEYWORDS = [
  // en
  'cart', 'checkout', 'basket', 'login', 'signin', 'sign-in', 'register', 'account', 'contact', 'form',
  // de
  'warenkorb', 'kasse', 'anmelden', 'einloggen', 'konto', 'kontakt', 'formular',
  // fr
  'panier', 'connexion', 'compte', 'contact', 'formulaire', 'commande',
  // pl
  'koszyk', 'logowanie', 'konto', 'kontakt', 'formularz',
  // es
  'carrito', 'iniciar-sesion', 'iniciar sesion', 'cuenta', 'contacto', 'formulario',
]

function keywordScore(str) {
  const s = str.toLowerCase()
  return PRIORITY_KEYWORDS.some((kw) => s.includes(kw)) ? 1 : 0
}

// Возвращает до `limit` абсолютных URL того же origin, отсортированных так, чтобы
// транзакционные/формовые страницы шли первыми; при равном приоритете сохраняется
// порядок появления в DOM (стабильная сортировка) — тот же порядок, что и у
// sameOriginLinks, чтобы поведение менялось предсказуемо, не случайно.
export function pickPriorityLinks(html, baseUrl, limit) {
  const origin = new URL(baseUrl).origin
  const anchors = extractAnchors(html)
  const seen = new Set([baseUrl])
  const candidates = []

  for (const { href, text } of anchors) {
    let abs
    try {
      abs = new URL(href, baseUrl).toString()
    } catch {
      continue
    }
    if (new URL(abs).origin !== origin) continue
    if (abs.includes('#')) continue
    if (seen.has(abs)) continue
    seen.add(abs)
    // Ключевые слова ищем и в пути (decode для "%20"/"-"), и в видимом тексте —
    // живой пример manufactum.de/warenkorb доказывает, что текста одного не хватает.
    let pathScore = 0
    try {
      pathScore = keywordScore(decodeURIComponent(new URL(abs).pathname))
    } catch {
      pathScore = keywordScore(new URL(abs).pathname)
    }
    const textScore = keywordScore(text)
    const score = pathScore * 2 + textScore // путь весит больше — надёжнее текста (иконки без текста, i18n)
    candidates.push({ abs, score })
  }

  // Array.prototype.sort в Node (V8) стабилен — порядок внутри одного score сохраняется.
  candidates.sort((a, b) => b.score - a.score)
  return candidates.slice(0, limit).map((c) => c.abs)
}
