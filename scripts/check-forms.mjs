#!/usr/bin/env node
// «Обнови формы» — проверка актуальности официальных судебных PDF.
//
//   npm run check-forms
//
// Для каждой зарегистрированной формы скачивает текущую официальную версию с
// courts.ca.gov и сверяет её SHA-256 с записанным baseline (sourceSha256 в
// FormTemplate). Judicial Council перепубликует PDF при изменении формы, поэтому
// смена хеша = форма обновилась → нужно перекачать файл, обновить revision и
// ПЕРЕПРОВЕРИТЬ маппинг полей (имена полей могли измениться).
//
// Текст ревизии в этих PDF закодирован глифами подмножества шрифта и не читается
// автоматически — поэтому сверяем по хешу источника, а не по строке "Rev. …".
// Код возврата: 0 — всё актуально, 1 — есть изменения/ошибки (удобно для CI).

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { FL100_TEMPLATE } from '../src/pdf/fl100.js'
import { FL105_TEMPLATE } from '../src/pdf/fl105.js'
import { FL110_TEMPLATE } from '../src/pdf/fl110.js'
import { FL140_TEMPLATE } from '../src/pdf/fl140.js'
import { FL141_TEMPLATE } from '../src/pdf/fl141.js'
import { FL142_TEMPLATE } from '../src/pdf/fl142.js'
import { FL144_TEMPLATE } from '../src/pdf/fl144.js'
import { FL150_TEMPLATE } from '../src/pdf/fl150.js'
import { FL180_TEMPLATE } from '../src/pdf/fl180.js'
import { FL190_TEMPLATE } from '../src/pdf/fl190.js'
import { FL341_TEMPLATE } from '../src/pdf/fl341.js'

const FORMS = [FL100_TEMPLATE, FL105_TEMPLATE, FL110_TEMPLATE, FL140_TEMPLATE, FL141_TEMPLATE, FL142_TEMPLATE, FL144_TEMPLATE, FL150_TEMPLATE, FL180_TEMPLATE, FL190_TEMPLATE, FL341_TEMPLATE]

function fetchSha256(url) {
  // curl follows the environment's proxy/CA config (works behind the agent proxy
  // and on a normal machine alike).
  const buf = execFileSync('curl', ['-fsSL', '--connect-timeout', '30', url], {
    maxBuffer: 64 * 1024 * 1024,
  })
  return createHash('sha256').update(buf).digest('hex')
}

const rows = []
let problems = 0

for (const f of FORMS) {
  if (!f.upstreamUrl || !f.sourceSha256) {
    rows.push({ id: f.id, revision: f.revision, status: '— нет upstream метаданных' })
    continue
  }
  try {
    const current = fetchSha256(f.upstreamUrl)
    const ok = current === f.sourceSha256
    if (!ok) problems++
    rows.push({
      id: f.id,
      revision: f.revision,
      status: ok ? '✓ актуальна' : '⚠️  ИЗМЕНИЛАСЬ — перекачать + перепроверить маппинг',
      current: current.slice(0, 12),
    })
  } catch (e) {
    problems++
    rows.push({ id: f.id, revision: f.revision, status: `✖ ошибка загрузки: ${e.message}` })
  }
}

const pad = (s, n) => String(s).padEnd(n)
console.log('\nПроверка ревизий форм (источник: courts.ca.gov)\n')
console.log(pad('Форма', 10), pad('Наша ревизия', 24), 'Статус')
console.log('-'.repeat(78))
for (const r of rows) {
  console.log(pad(r.id, 10), pad(r.revision || '—', 24), r.status)
}
console.log('')

if (problems) {
  console.log(`Итог: обнаружены изменения/ошибки (${problems}). Для устаревшей формы:`)
  console.log('  1) перекачать PDF в public/forms/, 2) обновить revision и sourceSha256')
  console.log('     в FormTemplate, 3) запустить inspectFormFields и перепроверить маппинг.')
  process.exit(1)
} else {
  console.log('Итог: все формы актуальны ✓')
}
