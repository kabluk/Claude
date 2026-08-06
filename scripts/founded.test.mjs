// G-FOUNDED / D-047: гейт на год основания в каталоге.
//
// Зачем отдельно от build-a11y.mjs: сборка проверяет текущий файл, а тест
// фиксирует САМО ПРАВИЛО — включая случаи, до которых реальные данные пока не
// дошли (ISO-дата вместо цитаты, год из чужой записи, год в будущем).
// Как и с ценами (scripts/priceband.test.mjs), частичное заполнение здесь —
// не временное состояние: большинство агентств год основания не публикует.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import agencies from '../data/a11y/agencies.json' with { type: 'json' }

// Та же логика, что в scripts/build-a11y.mjs: ищем ИМЕННО тот год, что стоит
// в поле, и не засчитываем вхождения внутри ISO-дат («checked 2026-08-06»).
const stripIsoDates = (s) => String(s).replace(/\d{4}-\d{2}-\d{2}/g, ' ')
const quotesYear = (label, year) => new RegExp(`(?<!\\d)${year}(?!\\d)`).test(stripIsoDates(label))

const dated = agencies.filter((a) => a.founded != null)

test('founded: значение — правдоподобный год, а не строка и не будущее', () => {
  const now = new Date().getFullYear()
  for (const a of dated) {
    assert.equal(typeof a.founded, 'number', `${a.slug}: founded не число`)
    assert.ok(Number.isInteger(a.founded), `${a.slug}: founded не целое`)
    assert.ok(a.founded >= 1800 && a.founded <= now, `${a.slug}: founded ${a.founded} вне 1800..${now}`)
  }
})

test('founded: у каждого года есть источник с дословной цитатой ЭТОГО года', () => {
  // Инвариант D-047. Без него «2011» неотличим от года регистрации домена,
  // копирайта в футере или основания материнской компании (D-044).
  for (const a of dated) {
    const quoted = a.sourceRefs.filter((r) => quotesYear(r.label || '', a.founded))
    assert.ok(quoted.length > 0, `${a.slug}: founded ${a.founded} без sourceRef с цитатой этого года`)
  }
})

test('founded: ISO-дата проверки не считается цитатой года', () => {
  // Регресс-тест на самую вероятную будущую ошибку: у каждого источника в
  // label стоит «checked 2026-08-06», и наивная проверка \b2026\b прошла бы
  // для founded: 2026 вообще без доказательства.
  assert.equal(quotesYear('about page; checked 2026-08-06', 2026), false)
  assert.equal(quotesYear('about page: "Established 2026"; checked 2026-08-06', 2026), true)
  assert.equal(quotesYear('audit price "1 999 zł"; checked 2026-08-06', 1999), false, 'год внутри числа не считается')
})

test('founded: пустое поле остаётся пустым — год не подставляет ни сборка, ни UI', () => {
  for (const a of agencies) {
    if (a.founded == null) assert.ok(a.founded === undefined || a.founded === null, a.slug)
  }
  assert.ok(dated.length < agencies.length, 'ожидается частичное заполнение, а не 100%')
})

test('founded: заполненность отражает рынок, а не сбор — но и не ноль', () => {
  // Страховка от тихой потери данных при следующем массовом патче.
  assert.ok(dated.length >= 60, `ожидалось ≥60 записей с годом, получено ${dated.length}`)
  const de = agencies.filter((a) => a.hq?.countryCode === 'DE')
  assert.ok(de.filter((a) => a.founded).length >= 10, 'немецкий срез не должен обнулиться')
})
