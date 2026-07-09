#!/usr/bin/env node
// «Обнови формы» — проверка актуальности официальных судебных PDF.
//
//   npm run check-forms
//
// Для каждой зарегистрированной формы скачивает ТЕКУЩУЮ официальную версию со
// стабильного URL courts.ca.gov (/documents/flXXX.pdf — всегда отдаёт актуальную
// ревизию) и сверяет:
//   1) РЕВИЗИЮ (напр. "Rev. July 1, 2025") — авторитетный сигнал содержания формы.
//      Извлекается из PDF через pdfjs-dist. Смена ревизии = форма реально обновилась
//      → перекачать PDF, обновить revision/sourceSha256, перепроверить маппинг полей.
//   2) SHA-256 байтов — вторичный сигнал. Если ревизия та же, но хеш другой, это
//      benign re-publish (те же поля, другие байты) — маппинг почти наверняка цел,
//      достаточно обновить sourceSha256.
//
// ВАЖНО (уроки сверки 2026-06-30):
//   - curl достаёт courts.ca.gov через прокси; WebFetch получает 403.
//   - НЕ использовать dated-path (/sites/.../YYYY-MM/flXXX.pdf) — отдаёт устаревшую
//     копию для форм, переREVленных позже. Стабильный /documents/flXXX.pdf — надёжен.
//
// Код возврата: 0 — все ревизии актуальны; 1 — ревизия изменилась или ошибка (для CI).

import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
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
import { FL342_TEMPLATE } from '../src/pdf/fl342.js'
import { FL343_TEMPLATE } from '../src/pdf/fl343.js'
import { FL345_TEMPLATE } from '../src/pdf/fl345.js'

const FORMS = [FL100_TEMPLATE, FL105_TEMPLATE, FL110_TEMPLATE, FL140_TEMPLATE, FL141_TEMPLATE, FL142_TEMPLATE, FL144_TEMPLATE, FL150_TEMPLATE, FL180_TEMPLATE, FL190_TEMPLATE, FL341_TEMPLATE, FL342_TEMPLATE, FL343_TEMPLATE, FL345_TEMPLATE]

// нормализует "Rev. July 1, 2025" / "July 1, 2025" → "july 1, 2025" для сравнения
const normRev = (s) => (s || '').replace(/^Rev\.\s*/i, '').trim().toLowerCase().replace(/\s+/g, ' ')

async function fetchForm(url) {
  // curl наследует прокси/CA окружения (работает и за agent-proxy, и на обычной машине)
  const buf = execFileSync('curl', ['-fsSL', '--connect-timeout', '30', url], {
    maxBuffer: 64 * 1024 * 1024,
  })
  const sha = createHash('sha256').update(buf).digest('hex')
  const doc = await getDocument({ data: new Uint8Array(buf), useSystemFonts: true, verbosity: 0 }).promise
  let txt = ''
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    txt += content.items.map((x) => x.str).join(' ') + '\n'
  }
  const m = txt.match(/Rev\.\s*[A-Za-z]+\s+\d+,\s*20\d\d/)
  return { sha, revision: m ? m[0] : null }
}

const rows = []
let changed = 0

for (const f of FORMS) {
  if (!f.upstreamUrl) {
    rows.push({ id: f.id, revision: f.revision, status: '— нет upstreamUrl' })
    continue
  }
  try {
    const official = await fetchForm(f.upstreamUrl)
    const revMatch = official.revision && normRev(official.revision) === normRev(f.revision)
    const shaMatch = official.sha === f.sourceSha256
    let status
    if (!official.revision) {
      // не смогли прочитать ревизию — падаем на SHA
      status = shaMatch ? '✓ актуальна (по SHA)' : (changed++, '⚠️  БАЙТЫ ИЗМЕНИЛИСЬ (ревизия не прочлась) — проверить вручную')
    } else if (!revMatch) {
      changed++
      status = `⚠️  РЕВИЗИЯ ИЗМЕНИЛАСЬ: ${f.revision} → ${official.revision}`
    } else if (!shaMatch) {
      status = 'ℹ re-publish (та же ревизия, новые байты) — обновить sourceSha256'
    } else {
      status = '✓ актуальна'
    }
    rows.push({ id: f.id, revision: f.revision, official: official.revision || '?', status })
  } catch (e) {
    changed++
    rows.push({ id: f.id, revision: f.revision, status: `✖ ошибка загрузки: ${e.message}` })
  }
}

const pad = (s, n) => String(s).padEnd(n)
console.log('\nПроверка ревизий форм (источник: courts.ca.gov /documents/, сверка по ревизии)\n')
console.log(pad('Форма', 8), pad('Наша ревизия', 22), pad('Официальная', 22), 'Статус')
console.log('-'.repeat(96))
for (const r of rows) {
  console.log(pad(r.id, 8), pad(r.revision || '—', 22), pad(r.official || '—', 22), r.status)
}
console.log('')

if (changed) {
  console.log(`Итог: реальных изменений/ошибок: ${changed}. Для изменившейся ревизии:`)
  console.log('  1) перекачать PDF в public/forms/, 2) обновить revision + sourceSha256')
  console.log('     в FormTemplate, 3) inspectFormFields → перепроверить маппинг полей.')
  process.exit(1)
} else {
  console.log('Итог: все ревизии актуальны ✓ (ℹ-строки — benign re-publish, обновите sourceSha256 при желании)')
}
