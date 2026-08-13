// D-143: публичная справка о правиле для карточки находки на /report/:id.
// Тест держит ГРАНИЦУ ПЕЙВОЛЛА (D-114/D-131) как контракт, а не как намерение:
// `publicRuleInfo` собирается только из данных сайта (en301549-coverage.json +
// описания наших модулей) и не имеет ни одного поля, куда могла бы просочиться
// подсказка axe-core «как это чинить» (help/helpUrl/failureSummary).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publicRuleInfo, wcagPageForRule, wcagPageBySlug, BEYOND_STANDARD_INFO } from './wcag.ts'

test('правило axe ведёт на РЕАЛЬНО существующую страницу критерия', () => {
  const page = wcagPageForRule('image-alt')
  assert.ok(page, 'image-alt покрывает 1.1.1 в coverage.json')
  assert.equal(page.row.wcag, '1.1.1')
  // Ссылка не может указать на страницу, которой нет: слаг обязан находиться
  // тем же поиском, которым страница строится в routes.tsx.
  assert.ok(wcagPageBySlug(page.slug))
})

test('собственная проверка воркера отдаёт своё описание и критерий', () => {
  const info = publicRuleInfo('a11y-keyboard-trap')
  assert.equal(info.title, 'No keyboard trap')
  assert.equal(info.page?.slug, '2-1-2')
  assert.match(info.ours ?? '', /Tab key/)
})

test('правило вне главы 9 получает заголовок и правовое основание, без страницы критерия', () => {
  const info = publicRuleInfo('a11y-statement-missing')
  assert.equal(info.title, BEYOND_STANDARD_INFO['a11y-statement-missing'].title)
  // Основание — не украшение: без него карточка называла бы требование
  // директивы «best practice» (см. ветку описания в ReportPage.tsx).
  assert.equal(info.basis, 'Directive (EU) 2019/882')
  assert.equal(info.page, null)
  assert.equal(info.ours, null)
})

test('best-practice-правило axe не получает выдуманного названия', () => {
  // `region` — реальное правило axe-core вне EN 301 549 ch.9. Никакого
  // названия для него в данных нет, и придумывать его нельзя: UI покажет сам
  // ruleId (D-035 — поле без источника не заполняется заглушкой).
  const info = publicRuleInfo('region')
  assert.equal(info.title, null)
  assert.equal(info.page, null)
})

test('PublicRuleInfo не имеет полей для платной подсказки axe (D-131)', () => {
  const info = publicRuleInfo('color-contrast')
  assert.deepEqual(Object.keys(info).sort(), ['basis', 'caveat', 'ours', 'page', 'title'])
  const serialized = JSON.stringify(info)
  for (const forbidden of ['help', 'helpUrl', 'failureSummary', 'Fix any of the following']) {
    assert.ok(!serialized.includes(forbidden), `${forbidden} не должен попадать в бесплатный отчёт`)
  }
})
