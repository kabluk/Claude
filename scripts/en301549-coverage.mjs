#!/usr/bin/env node
// Карта покрытия EN 301 549 гл. 9 (Web) нашим сканером — D-035.
//
// Зачем: до этого мы не знали, какую долю гармонизированного стандарта реально
// закрываем, и узнавали требования «по ходу пьесы». Стандарт один на весь ЕС
// (D-033), поэтому одной карты хватает для всех 13 юрисдикций — национальные
// законы различаются санкциями и порогами, а не требованиями.
//
// Источники (нормативные, не пересказы):
//   EN 301 549 V3.2.1 (2021-03) — ETSI, https://www.etsi.org/deliver/etsi_en/
//     301500_301599/301549/03.02.01_60/en_301549v030201p.pdf
//     Глава 9 извлечена в data/a11y/en301549-web.json (50 критериев без Void),
//     чтобы не держать 2.2 МБ PDF в репозитории.
//   Directive (EU) 2019/882 (EAA) — обязанности, которых в EN 301 549 нет вовсе
//     (заявление о доступности, канал обратной связи) — см. EAA_ONLY ниже.
//
// Покрытие считается из РЕАЛЬНЫХ метаданных axe-core (axe.getRules() → теги
// wcagXYZ), а не из предположений о том, что axe умеет. Пересчитывать при
// обновлении axe-core: `npm run en301549:coverage`.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import axe from 'axe-core'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CLAUSES = JSON.parse(readFileSync(join(ROOT, 'data', 'a11y', 'en301549-web.json'), 'utf8'))

// Наши собственные проверки поверх axe (worker/lib/domChecks.js, D-030).
// Ключ — критерий EN 301 549, значение — ruleId, который видит пользователь.
export const OUR_CHECKS = {
  '9.1.2.2': 'a11y-video-no-captions',
  '9.1.4.2': 'a11y-autoplay-media',
  '9.1.4.4': 'a11y-resize-200',
  '9.1.4.10': 'a11y-reflow-320',
  '9.2.1.2': 'a11y-keyboard-trap',
  '9.2.4.7': 'a11y-focus-invisible',
  // D-036 — проверки уровня сайта (worker/lib/siteChecks.js): требуют СРАВНЕНИЯ
  // страниц между собой, поэтому не покрывались ни axe, ни поштучными DOM-проверками.
  '9.2.4.5': 'a11y-multiple-ways',
  '9.3.2.3': 'a11y-inconsistent-navigation',
  '9.3.2.4': 'a11y-inconsistent-identification',
  // D-039 — расширение уже существующего обхода Tab и простой DOM-запрос,
  // без второго прохода по странице и без новых браузерных API.
  '9.2.4.3': 'a11y-focus-order',
  '9.2.4.6': 'a11y-empty-heading',
}

// Обязанности из самой директивы, которых в главе 9 EN 301 549 нет — стандарт
// описывает ТЕХНИЧЕСКУЮ доступность, а не наличие документов. Именно с них
// начинает надзор (BACKLOG.md), поэтому считаем их отдельно, не растворяя в
// проценте покрытия стандарта.
export const EAA_ONLY = {
  'a11y-statement-missing': 'Directive (EU) 2019/882 — accessibility statement',
  'a11y-statement-incomplete': 'Directive (EU) 2019/882 — accessibility statement contents',
  'a11y-feedback-missing': 'Directive (EU) 2019/882 — accessible feedback channel',
  'a11y-pdf-present': 'EN 301 549 ch. 10 (non-web documents) — вне главы 9',
}

// axe-core помечает правила тегами wcag111/wcag1410 и т.п. Разбор: первые две
// цифры — принцип и раздел, остаток — номер критерия (может быть двузначным,
// напр. wcag1410 → 1.4.10). Считаем из живого axe.getRules(), не из таблицы.
export function axeCoverageByWcag(rules) {
  const map = {}
  for (const rule of rules) {
    for (const tag of rule.tags ?? []) {
      const m = /^wcag(\d)(\d)(\d+)$/.exec(tag)
      if (!m) continue
      const sc = `${m[1]}.${m[2]}.${m[3]}`
      ;(map[sc] ??= []).push(rule.ruleId)
    }
  }
  return map
}

export function buildCoverage(clauses, axeByWcag, ourChecks) {
  return clauses.map((c) => {
    const axeRules = axeByWcag[c.wcag] ?? []
    const ours = ourChecks[c.clause] ?? null
    const status = axeRules.length && ours ? 'both' : axeRules.length ? 'axe' : ours ? 'ours' : 'none'
    return { ...c, status, axeRules, ours }
  })
}

function render(rows) {
  const n = rows.length
  const covered = rows.filter((r) => r.status !== 'none').length
  const pct = Math.round((covered / n) * 100)
  const badge = { both: '✅ axe + наша', axe: '✅ axe-core', ours: '✅ наша', none: '— нет' }

  const lines = []
  lines.push('# EN 301 549 — карта покрытия сканером')
  lines.push('')
  lines.push('<!-- СГЕНЕРИРОВАНО scripts/en301549-coverage.mjs — не править руками.')
  lines.push('     Пересобрать: npm run en301549:coverage -->')
  lines.push('')
  lines.push(`Глава 9 (Web) EN 301 549 V3.2.1 — **${n}** критериев (Void исключены).`)
  lines.push(`Покрыто автоматически: **${covered} из ${n} (${pct}%)**.`)
  lines.push('')
  lines.push('Стандарт гармонизирован на весь ЕС (D-033), поэтому карта одна для всех')
  lines.push('13 юрисдикций — национальные законы различаются санкциями и областью')
  lines.push('применения, а не требованиями.')
  lines.push('')
  lines.push('⚠ «Покрыто» = существует автоматическая проверка, а НЕ «соответствие')
  lines.push('доказано». Автотест находит часть нарушений критерия, не подтверждает его')
  lines.push('выполнение. Ни один процент здесь не является заявлением о соответствии.')
  lines.push('')
  lines.push('## Обязанности из директивы (вне главы 9)')
  lines.push('')
  lines.push('EN 301 549 описывает техническую доступность и ничего не говорит о')
  lines.push('документах. Эти проверки происходят из самой EAA и в процент выше не входят:')
  lines.push('')
  lines.push('| Проверка | Основание |')
  lines.push('|---|---|')
  for (const [ruleId, basis] of Object.entries(EAA_ONLY)) lines.push(`| \`${ruleId}\` | ${basis} |`)
  lines.push('')
  lines.push('## Критерии главы 9')
  lines.push('')
  lines.push('| Пункт | WCAG | Критерий | Покрытие | Чем |')
  lines.push('|---|---|---|---|---|')
  for (const r of rows) {
    const by = r.status === 'none' ? '' : [r.ours, ...r.axeRules].filter(Boolean).map((x) => `\`${x}\``).join(', ')
    lines.push(`| ${r.clause} | ${r.wcag} | ${r.title} | ${badge[r.status]} | ${by} |`)
  }
  lines.push('')
  lines.push('## Не покрытые критерии')
  lines.push('')
  lines.push('Требуют ручного аудита либо принципиально не автоматизируются')
  lines.push('(смысл, последовательность, контекст). Это честная граница продукта —')
  lines.push('именно здесь начинается работа агентства из каталога.')
  lines.push('')
  for (const r of rows.filter((x) => x.status === 'none')) {
    lines.push(`- **${r.clause}** (WCAG ${r.wcag}) — ${r.title}`)
  }
  lines.push('')
  return lines.join('\n')
}

function main() {
  const axeByWcag = axeCoverageByWcag(axe.getRules())
  const rows = buildCoverage(CLAUSES, axeByWcag, OUR_CHECKS)
  writeFileSync(join(ROOT, 'docs', 'project', 'EN301549-COVERAGE.md'), render(rows))

  // Тот же расчёт — в JSON для публичной страницы /methodology (D-037). Сайт НЕ
  // импортирует axe-core (это утяжелило бы бандл) и не пересчитывает покрытие
  // сам: единственный источник правды — этот скрипт, страница только рисует.
  writeFileSync(
    join(ROOT, 'data', 'a11y', 'en301549-coverage.json'),
    JSON.stringify(
      { generatedFrom: 'EN 301 549 V3.2.1 ch.9 + axe-core ' + axeVersion() + ' + worker/lib checks', rows },
      null,
      1,
    ) + '\n',
  )

  const covered = rows.filter((r) => r.status !== 'none').length
  console.log(`✓ en301549-coverage: ${covered}/${rows.length} критериев покрыто → docs/project/EN301549-COVERAGE.md + data/a11y/en301549-coverage.json`)
}

function axeVersion() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'node_modules', 'axe-core', 'package.json'), 'utf8')).version
  } catch {
    return 'unknown'
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
