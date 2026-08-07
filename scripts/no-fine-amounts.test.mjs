// D-035/D-058: суммы штрафов убраны из проекта «как класс», не «пока не
// проверены» — см. DECISIONS.md D-035. Дважды после этого решения суммы всё
// равно просачивались обратно: D-041 нашла их в немецком гайде (правило
// применили к коду и забыли про контент), D-058 — в audit-rgaa-guide.md и
// строке Германии в european-accessibility-act-guide.md (написаны до D-035,
// никто не сверил задним числом). Постоянный гейт нужен именно на контент
// гайдов — код (jurisdictionNote/maxFineEUR) уже сторожат другие тесты
// (worker/lib/jurisdiction.test.mjs).
//
// Эвристика: строка нарушает правило, только если в ней ОДНОВРЕМЕННО есть
// упоминание штрафа/санкции И денежная сумма — так проходит легитимный
// контент про пороги (микропредприятия «EUR 2 млн» — не штраф) и про цены
// аудита (bitv-test-kosten-ablauf.md — не про штраф).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const GUIDES_DIR = join(ROOT, 'data/a11y/guides')

const FINE_WORD =
  /\b(fine|penalty|penalties|Bußgeld|Geldbuße|Strafe|Ordnungswidrigkeit(?:en)?|sanction[s]?\s+p[ée]cuniaire|amende[s]?|multa|b[øo]de|b[öo]ter|sakko)\b/i
// €NNN / EUR NNN / NNN euros / NNN kr — с хотя бы одной цифрой рядом с валютой.
const MONEY = /(?:€|EUR|kr\.?)\s?\d[\d.,]*|\d[\d.,]*\s?(?:€|EUR|euros?|Euro|kr\.?|kronor|kroner)\b/i

const files = readdirSync(GUIDES_DIR).filter((f) => f.endsWith('.md'))

test('гайды: ни в одной строке нет одновременно суммы и слова про штраф/санкцию (D-035, D-058)', () => {
  const violations = []
  for (const file of files) {
    const text = readFileSync(join(GUIDES_DIR, file), 'utf8')
    const lines = text.split('\n')
    lines.forEach((line, i) => {
      if (FINE_WORD.test(line) && MONEY.test(line)) {
        violations.push(`${file}:${i + 1}: ${line.trim().slice(0, 140)}`)
      }
    })
  }
  assert.deepEqual(violations, [], `Найдена сумма штрафа рядом со словом о санкции:\n${violations.join('\n')}`)
})
