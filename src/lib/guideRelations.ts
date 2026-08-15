// G-INTERLINK-AUDIT (2026-08-15): чистая логика перелинковки гайдов, вынесена
// из guides.ts В ОТДЕЛЬНЫЙ файл — не ради красоты, а ради тестируемости.
// guides.ts на верхнем уровне модуля вызывает `import.meta.glob` (Vite-
// специфика, читает data/a11y/guides/*.md при сборке) — эта строка выполняется
// при ЛЮБОМ импорте ЛЮБОГО экспорта модуля, даже если сама функция его не
// трогает. `tsx --test` (src:test) не исполняет import.meta.glob вне сборки
// и падает уже на этапе импорта. `import type` ниже стирается транспайлером
// (erasable), поэтому не тянет за собой guides.ts в рантайме — только тип.
import type { GuideDoc } from './guides'

// Приоритет совпадения — тот же сигнал, что уже используют countryCode/
// standard в guidesFor(): сначала общий СТАНДАРТ (BFSG-гайд ведёт к другому
// BFSG-гайду вернее, чем к гайду про другую страну с тем же языком), при
// нехватке добираем той же СТРАНОЙ. Себя самого исключаем.
export function relatedGuidesFor(all: GuideDoc[], g: GuideDoc, limit = 4): GuideDoc[] {
  const bySameStandard = all.filter((o) => o.slug !== g.slug && g.standard && o.standard === g.standard)
  if (bySameStandard.length >= limit) return bySameStandard.slice(0, limit)
  const bySameCountry = all.filter(
    (o) => o.slug !== g.slug && g.countryCode && o.countryCode === g.countryCode && !bySameStandard.includes(o),
  )
  return [...bySameStandard, ...bySameCountry].slice(0, limit)
}
