// G-I18N-CHROME (D-102): гейт словаря шапки/футера/обвязки гайдов.
//
// Ловит два класса дефектов, каждый из которых уже случался в проекте в том
// или ином виде:
//
// 1. НЕПОЛНЫЙ ПЕРЕВОД. Немецкий chrome жил на проде месяцами с английскими
//    «Updated»/«FAQ»/«Ready for the next step?» внутри немецкой шапки —
//    ключи просто не существовали в словаре, и никакой тест этого не видел.
//    Теперь любая новая локаль обязана заполнить ВСЕ ключи, и ни одно
//    значение не может остаться английским по недосмотру.
//
// 2. ЧИСЛОЗАВИСИМАЯ ГРАММАТИКА. Польский меняет форму существительного в
//    зависимости от числа агентств. Сейчас их 245 → родительный мн.
//    («dostawców»), но при 243 форма обязана стать именительной
//    («dostawcy»). Каталог растёт — этот тест сработает раньше, чем текст
//    станет неграмотным для польского читателя.
//
// Словарь читается как ТЕКСТ, а не импортом: файл — .ts, а тест-раннер
// проекта гоняет .mjs через tsx без сборки типов; для проверки структуры
// достаточно распарсить исходник (тот же приём, что в jurisdictions.test.mjs).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const source = fs.readFileSync(path.join(dir, 'i18n.ts'), 'utf8')

const LOCALES = ['en', 'de', 'fr', 'pl']

// Тело `const <locale>: ChromeDict = { ... }` до строки, закрывающей объект в
// нулевой колонке — форматирование фиксирует prettier, так что якорь надёжен.
function dictBody(locale) {
  const start = source.indexOf(`const ${locale}: ChromeDict = {`)
  assert.notEqual(start, -1, `в i18n.ts нет словаря для локали ${locale}`)
  const end = source.indexOf('\n}', start)
  assert.notEqual(end, -1, `не найден конец словаря ${locale}`)
  return source.slice(start, end)
}

test('каждая локаль заполняет ровно тот же набор ключей, что и английская', () => {
  // Ключи берём из английского словаря — он эталон полноты.
  const keysOf = (body) => [...body.matchAll(/^\s{2,6}([a-zA-Z]+):/gm)].map((m) => m[1]).sort()
  const expected = keysOf(dictBody('en'))
  assert.ok(expected.length > 15, `подозрительно мало ключей у en: ${expected.length}`)
  for (const loc of LOCALES.filter((l) => l !== 'en')) {
    assert.deepEqual(
      keysOf(dictBody(loc)),
      expected,
      `словарь ${loc} расходится с en по набору ключей — неполный перевод`,
    )
  }
})

test('ни одна не-английская локаль не оставляет английские строки-заглушки', () => {
  // Точные значения из en, которые не должны дословно повторяться в других
  // словарях. Исключения перечислены явно: это интернационализмы, которые в
  // соответствующем языке действительно пишутся так же.
  const SAME_ON_PURPOSE = {
    de: ['Scan', 'Kontakt', 'FAQ', 'Impressum'],
    fr: ['Services', 'Experts', 'Contact', 'FAQ'],
    pl: ['Kontakt', 'FAQ'],
  }
  const enBody = dictBody('en')
  const enValues = [...enBody.matchAll(/:\s*'([^']{2,})'/g)].map((m) => m[1])
  for (const loc of LOCALES.filter((l) => l !== 'en')) {
    const body = dictBody(loc)
    const values = [...body.matchAll(/:\s*'([^']{2,})'/g)].map((m) => m[1])
    const leaked = values.filter(
      (v) => enValues.includes(v) && !(SAME_ON_PURPOSE[loc] ?? []).includes(v),
    )
    assert.deepEqual(leaked, [], `в словаре ${loc} остались английские строки: ${leaked.join(', ')}`)
  }
})

test('польская форма существительного меняется по числу (245 → dostawców, 243 → dostawcy)', async () => {
  // Правило: число оканчивается на 2/3/4, но не на 12–14 → именительный мн.;
  // иначе → родительный мн. Проверяем саму реализацию, а не её описание:
  // вырезаем функцию из исходника и исполняем.
  const m = source.match(/const plAgencyNoun = \(n: number\): string => \{[\s\S]*?\n\}/)
  assert.ok(m, 'plAgencyNoun не найдена в i18n.ts')
  const js = m[0].replace(/: number/g, '').replace(/: string/g, '')
  const plAgencyNoun = eval(`(${js.replace('const plAgencyNoun = ', '')})`)

  const NOM = 'zweryfikowani dostawcy'
  const GEN = 'zweryfikowanych dostawców'
  // Именительный мн.: 2/3/4 и все числа, оканчивающиеся на них.
  for (const n of [2, 3, 4, 22, 43, 154, 243, 1002]) {
    assert.equal(plAgencyNoun(n), NOM, `${n} должно давать именительный мн.`)
  }
  // Родительный мн.: 0/1, 5–21 (включая ловушку 12–14) и «круглые» окончания.
  for (const n of [0, 1, 5, 11, 12, 13, 14, 19, 20, 100, 112, 245, 1000] ) {
    assert.equal(plAgencyNoun(n), GEN, `${n} должно давать родительный мн.`)
  }
})
