// G-CHECKER-HTML-PARSER (D-183): извлечение структур из вставленного HTML
// через DOMParser. Тонкая браузерная обёртка — вся логика решений в
// htmlAudit.ts (чистое ядро, отдельно тестируется). Здесь только «достать из
// DOM то, что ядро анализирует», без единого суждения о том, ошибка это или
// нет.
//
// DOMParser разбирает СТРОКУ как отдельный документ — он НЕ исполняет
// скрипты, не грузит ресурсы, не делает сетевых запросов (в отличие от
// innerHTML живого документа). Именно поэтому вставка чужого HTML сюда
// безопасна и остаётся чисто клиентской: мы разбираем текст, а не оживляем
// страницу.

import type { HeadingInfo, ImageInfo } from './htmlAudit'

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

export function extractImages(html: string): ImageInfo[] {
  const doc = parse(html)
  return [...doc.querySelectorAll('img')].map((img) => {
    // hasAttribute vs getAttribute: null (атрибута нет) и '' (alt="")
    // семантически разные, и ядро на них реагирует по-разному — сохраняем
    // различие, не схлопываем в ''.
    const alt = img.hasAttribute('alt') ? img.getAttribute('alt') ?? '' : null
    const role = (img.getAttribute('role') ?? '').toLowerCase()
    const decorativeByRole =
      role === 'presentation' || role === 'none' || img.getAttribute('aria-hidden') === 'true'
    return { alt, src: img.getAttribute('src') ?? '', decorativeByRole }
  })
}

export function extractHeadings(html: string): HeadingInfo[] {
  const doc = parse(html)
  // Порядок ДОКУМЕНТА обязателен: анализ уровней (пропуск/подъём) имеет смысл
  // только на реальной последовательности заголовков. querySelectorAll
  // возвращает элементы в порядке документа — не сортируем и не группируем.
  const nodes = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')
  return [...nodes].map((el) => ({
    level: Number(el.tagName[1]),
    // textContent, а не innerText: парсированный документ не в layout, у него
    // нет innerText. Схлопываем пробелы — переносы строк в разметке не должны
    // выглядеть как «пустой заголовок».
    text: (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
  }))
}
