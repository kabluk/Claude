// Детект доступного канала обратной связи — A3-FEEDBACK.
//
// EAA/EN 301 549 требуют минимум один канал (email/форма/телефон), которым
// пользователь может сообщить о проблеме доступности. Официальный EU-шаблон
// заявления (Commission Implementing Decision (EU) 2018/1523) называет этот
// раздел одинаково во всех странах-членах — "Feedback and contact information" /
// "Retour d'information et contact" и т.п. Это самый надёжный сигнал (не
// произвольное упоминание слова "contact" где угодно на сайте).
//
// Живая проверка (2026-08-06): наивная идея "искать <form> тег" провалилась —
// на bundesregierung.de единственный <form> на странице feedback принадлежит
// cookie-consent баннеру, не механизму обратной связи (см. A3-COOKIEBANNER —
// тот же класс проблемы, баннер путает наивный анализ DOM). Переключились на
// поиск по тексту официальных заголовков раздела + типовых фраз форм.

import { normalizeText } from './textUtils.js'

const FEEDBACK_PATTERNS = [
  // Официальный заголовок раздела EU-шаблона заявления — самый надёжный сигнал
  'feedback and contact information', 'retour d\'information et contact',
  'rückmeldungen und kontaktangaben', 'rückmeldung und kontaktangaben',
  'informacje zwrotne i dane kontaktowe', 'comentarios y datos de contacto',
  'feedback en contactgegevens',
  // Типовые формулировки формы/канала именно для доступности
  'feedback-formular', 'barriere melden', 'melden sie eine barriere', 'kontaktformular',
  'accessibility feedback', 'report an accessibility problem', 'report accessibility issue',
  'accessibility complaint', 'contact us about accessibility',
  'signaler un problème d\'accessibilité', 'signalement d\'un défaut d\'accessibilité',
  'faire part de vos remarques', 'vous pouvez contacter',
  'zgłoś problem z dostępnością', 'zgłoszenie braku dostępności',
  'comunicar un problema de accesibilidad', 'notificar un problema de accesibilidad',
  'toegankelijkheidsprobleem melden',
]

// Ищем ссылку/адрес самого канала ТОЛЬКО внутри окна текста вокруг найденной
// фразы — иначе ловим случайные mailto: share-виджетов ("поделиться по почте"),
// как на bundesregierung.de (реально найдено при живой проверке). Помимо
// mailto:/tel: ищем и голый email как текст — impots.gouv.fr публикует
// contact-accessibilite@dgfip.finances.gouv.fr прямо в тексте, без mailto:
// (тоже найдено живой проверкой, не по предположению).
const CONTACT_LINK_RE = /(mailto:[^\s"'<>]+|tel:[^\s"'<>]+|[\w.+-]+@[\w-]+\.[\w.-]+)/gi

export function detectFeedbackChannel(html) {
  const rawText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const text = normalizeText(rawText)

  for (const phrase of FEEDBACK_PATTERNS) {
    const idx = text.indexOf(normalizeText(phrase))
    if (idx === -1) continue
    // окно ±400 символов вокруг совпадения в СЫРОМ тексте (индексы normalize
    // могут немного разъехаться из-за NFD, поэтому ищем и в rawText тем же phrase
    // регистронезависимо как approx — контакт-ссылку достаточно найти где-то рядом)
    const rawIdx = rawText.toLowerCase().indexOf(phrase.toLowerCase())
    const windowStart = Math.max(0, (rawIdx === -1 ? idx : rawIdx) - 400)
    const windowEnd = Math.min(rawText.length, (rawIdx === -1 ? idx : rawIdx) + 400)
    const nearby = rawText.slice(windowStart, windowEnd)
    const link = nearby.match(CONTACT_LINK_RE)?.[0] ?? null
    return { found: true, matchedPhrase: phrase, contactLink: link }
  }

  // Fallback (D-165): специфичной a11y-фразы нет, но на странице объективно ЕСТЬ
  // достижимый канал — реальный mailto: с адресом, tel: или ссылка на контакт-страницу.
  // Лениентная трактовка EAA (годится любой достижимый канал) — иначе ложное
  // a11y-feedback-missing на сайтах с явным email/телефоном в футере. Share-виджеты
  // (`mailto:?subject=…` без адреса) НЕ считаются — требуем реальный адрес.
  const realMailto = /mailto:[\w.+-]+@[\w-]+\.[\w.-]+/i.exec(html)?.[0]
  const telLink = /tel:\+?[\d()\s.-]{6,}/i.exec(html)?.[0]
  const contactPage = /<a\b[^>]*href\s*=\s*["']?[^"'>#]*(?:\/kontakt|\/contact|\/contacto|\/contatti|contact-us|contact-uns)[^"'>\s]*/i.test(html)
  const channel = realMailto || telLink || null
  if (channel || contactPage) {
    return { found: true, matchedPhrase: 'generic-contact-channel', contactLink: channel }
  }

  return { found: false, matchedPhrase: null, contactLink: null }
}
