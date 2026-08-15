// G-CHECKER-INTERLINK (D-179, 2026-08-15): чистая логика перелинковки чекеров.
// Вынесена отдельным файлом по тому же принципу и по той же причине, что
// guideRelations.ts (D-176): реестр в checkers.ts тянет `paths` из data.ts,
// который читает JSON-таксономии через Vite-алиасы — импорт реестра в
// `tsx --test` (src:test) утащил бы за собой всю эту цепочку. Здесь — только
// типы и функция, оба без побочных эффектов.

export type CheckerTopic = 'colour' | 'text' | 'markup'

export interface CheckerEntry {
  href: string
  title: string
  dek: string
  // Тематическая семья. Цветовые чекеры (контраст/дальтонизм/конвертер/
  // палитра) осмысленно ведут друг к другу: человек, подбирающий палитру,
  // с большой вероятностью следом проверит контраст. Текстовые (читаемость/
  // синтез речи) — своя пара. Это не украшение: без такого признака
  // «связанные» были бы просто «следующие по списку», то есть случайными.
  topic: CheckerTopic
}

// Приоритет — та же семья, затем добор остальными. Себя исключаем.
// Порядок внутри группы — порядок реестра (стабилен между сборками, не
// зависит от того, с какой страницы смотрим).
//
// В отличие от relatedGuidesFor (D-176), добор ВСЕГДА возможен: чекеров
// всего 6, и «своя семья» никогда не покрывает лимит целиком — поэтому
// вторая группа здесь не запасной путь на редкий случай, а штатная часть
// выдачи. Соседние по теме идут первыми, остальные — следом.
export function relatedCheckersFor(
  all: CheckerEntry[],
  currentHref: string,
  limit = 3,
): CheckerEntry[] {
  const others = all.filter((c) => c.href !== currentHref)
  const current = all.find((c) => c.href === currentHref)
  if (!current) return others.slice(0, limit)
  const sameTopic = others.filter((c) => c.topic === current.topic)
  const rest = others.filter((c) => c.topic !== current.topic)
  return [...sameTopic, ...rest].slice(0, limit)
}
