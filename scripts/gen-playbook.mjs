#!/usr/bin/env node
// Печатный плейбук DETNAV (PDF) из контента сайта — по файлу на язык.
// Контент не дублируется: читаются те же content/<lang>/*.ts, что и на
// сайте, поэтому плейбук всегда совпадает с опубликованным текстом.
//
// Запуск:  node --experimental-strip-types scripts/gen-playbook.mjs [en|es|ru]
// Выход:   dist-playbook/detnav-playbook-<lang>.pdf (+ .html для правок)
// PDF печатает headless Chromium; все ссылки в PDF кликабельные.
// После правок контента: перегенерировать и скопировать в public/playbook/.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { register } from 'node:module'

// Контент-файлы могут импортировать значения по vite-алиасу «@/…» —
// учим ноду его разрешать (см. scripts/alias-loader.mjs).
register('./alias-loader.mjs', import.meta.url)

const ROOT = new URL('..', import.meta.url).pathname
const OUT = join(ROOT, 'dist-playbook')
const CHROMIUM = '/opt/pw-browsers/chromium'
const ORIGIN = 'https://detnav.com'

const slugs = JSON.parse(readFileSync(join(ROOT, 'content/slugs.json'), 'utf8'))
const states = JSON.parse(readFileSync(join(ROOT, 'data/states.json'), 'utf8'))
const urlFor = (lang, key) =>
  `${ORIGIN}/${lang}/${slugs[key]?.[lang] ? slugs[key][lang] + '/' : ''}`

// Структура — путь семьи по времени, а не порядок страниц сайта.
// 'ORGS' — собранный из data/states.json раздел организаций (внутри части II:
// это источник бесплатных адвокатов, ему место рядом с поиском адвоката).
const STRUCTURE = [
  { part: 'p1', keys: ['where', 'firstcall', 'connect'] },
  { part: 'p2', keys: ['attorney', 'verify', 'ORGS', 'docpack'] },
  { part: 'p3', keys: ['habeas'] },
  { part: 'p4', keys: ['journey', 'prepare', 'glossary'] },
]

const T = {
  ru: {
    cover1a: 'Порядок',
    cover1b: 'действий',
    edition: 'Печатная версия · август 2026',
    notes: 'Заметки',
    parts: {
      p1: 'Часть I · Первые часы: найти, дозвониться, наладить связь',
      p2: 'Часть II · Адвокат — главное дело',
      p3: 'Часть III · Пути выхода',
      p4: 'Часть IV · Дальше и надолго',
    },
    cover2: 'Если человека задержала иммиграционная служба США',
    chips: ['БЕСПЛАТНО', 'БЕЗ РЕГИСТРАЦИИ', 'EN · ES · RU', 'ZERO-DATA'],
    coverNote:
      'Печатная версия материалов detnav.com. На сайте всё то же самое — бесплатно и всегда свежее. Правила меняются: сверяйте дату.',
    toc: 'Что внутри',
    online: 'Эта страница на сайте — с инструментами и поиском:',
    links: 'Ссылки раздела — нажмите, чтобы открыть',
    orgsH: 'Организации помощи по штатам',
    orgsLede: 'Проверенные некоммерческие организации — юридическая помощь и поддержка семей. Ссылки кликабельны.',
    disclaimer:
      'Мы не адвокаты и не даём юридических консультаций. Здесь только факты и ссылки на официальные источники. Что применимо к конкретному делу — определяет адвокат.',
  },
  en: {
    cover1a: 'What To Do,',
    cover1b: 'Step by Step',
    edition: 'Print edition · August 2026',
    notes: 'Notes',
    parts: {
      p1: 'Part I · The first hours: find, get the call, stay connected',
      p2: 'Part II · The attorney — job one',
      p3: 'Part III · Paths out',
      p4: 'Part IV · The longer road',
    },
    cover2: 'When someone is detained by U.S. immigration',
    chips: ['FREE', 'NO SIGN-UP', 'EN · ES · RU', 'ZERO-DATA'],
    coverNote:
      'A printable edition of detnav.com. Everything is on the site too — free and always current. Rules change: check the date.',
    toc: 'What is inside',
    online: 'This page on the site — with tools and search:',
    links: 'Links for this section — tap to open',
    orgsH: 'Help organizations by state',
    orgsLede: 'Verified nonprofits — legal help and family support. Links are clickable.',
    disclaimer:
      'We are not attorneys and we do not give legal advice. Only facts and links to official sources. What applies to a specific case is for an attorney to determine.',
  },
  es: {
    cover1a: 'Qué hacer,',
    cover1b: 'paso a paso',
    edition: 'Edición impresa · agosto de 2026',
    notes: 'Notas',
    parts: {
      p1: 'Parte I · Las primeras horas: encontrar, la llamada, el contacto',
      p2: 'Parte II · El abogado — lo principal',
      p3: 'Parte III · Caminos de salida',
      p4: 'Parte IV · El camino largo',
    },
    cover2: 'Cuando inmigración detiene a una persona en EE. UU.',
    chips: ['GRATIS', 'SIN REGISTRO', 'EN · ES · RU', 'ZERO-DATA'],
    coverNote:
      'Edición imprimible de detnav.com. Todo está también en el sitio — gratis y siempre al día. Las reglas cambian: mire la fecha.',
    toc: 'Qué hay adentro',
    online: 'Esta página en el sitio — con herramientas y búsqueda:',
    links: 'Enlaces de esta sección — toque para abrir',
    orgsH: 'Organizaciones de ayuda por estado',
    orgsLede: 'Organizaciones sin fines de lucro verificadas — ayuda legal y apoyo a familias. Los enlaces son clicables.',
    disclaimer:
      'No somos abogados y no damos asesoría legal. Solo hechos y enlaces a fuentes oficiales. Qué aplica a un caso concreto lo determina un abogado.',
  },
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>')
const A = (href, text) => `<a href="${esc(href)}">${text}</a>`
// Карточка-действие: целиком кликабельная, капс-лейбл + жирный URL.
const act = (href, label, cls = '') =>
  `<a class="act ${cls}" href="${esc(href)}"><span class="act-l">→ ${esc(label)}</span><span class="act-u">${esc(href)}</span></a>`

function renderBlocks(blocks, lang) {
  let h = ''
  for (const b of blocks) {
    switch (b.kind) {
      case 'h2':
        h += `<h3>${inline(b.text)}</h3>`
        break
      case 'p':
        h += `<p${b.dim ? ' class="dim"' : ''}>${inline(b.text)}</p>`
        break
      case 'list':
        h += `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`
        break
      case 'steps':
        h +=
          (b.title ? `<p class="steps-t">${inline(b.title)}</p>` : '') +
          `<ol class="steps">${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ol>`
        break
      case 'fields':
        h += `<div class="fields">${b.title ? `<div class="fields-t">${esc(b.title)}</div>` : ''}${b.items
          .map((i) => `<div class="field"><span>${inline(i)}</span><i></i></div>`)
          .join('')}</div>`
        break
      case 'callout':
        h += `<div class="box ${b.tone}"><div class="box-t">${inline(b.title)}</div>${b.body
          .map((p) => `<p>${inline(p)}</p>`)
          .join('')}</div>`
        break
      case 'memcard':
        h += `<div class="mem"><div class="mem-t">${esc(b.title)}</div>${b.lines
          .map((l) => `<p>${esc(l)}</p>`)
          .join('')}${(b.alts ?? []).map((a) => `<p class="alt">${esc(a)}</p>`).join('')}</div>`
        break
      case 'terms':
        h += `<dl class="terms">${b.items
          .map((it) => `<div class="term"><dt>${inline(it.term)}</dt><dd>${inline(it.def)}</dd></div>`)
          .join('')}</dl>`
        break
      case 'compare':
        h += `<div class="cmp">${b.title ? `<div class="kicker">${esc(b.title)}</div>` : ''}<div class="cmp-g">${[b.a, b.b]
          .map(
            (c) =>
              `<div class="cmp-c"><div class="cmp-h">${esc(c.h)}</div><div class="cmp-s">${esc(c.sub)}</div><ul>${c.rows
                .map((r) => `<li>${inline(r)}</li>`)
                .join('')}</ul></div>`,
          )
          .join('')}</div>${b.note ? `<p class="dim">${esc(b.note)}</p>` : ''}</div>`
        break
      case 'ext':
        h += act(b.href, b.label)
        break
      case 'onward':
        for (const s of b.sources ?? []) h += act(s.href, s.label)
        break
      case 'ilink':
        h += act(urlFor(lang, b.page), b.label)
        break
      default:
        break
    }
  }
  return h
}

async function build(lang) {
  const t = T[lang]
  const ui = (await import(`../content/${lang}/ui.ts`)).default
  const sections = []

  // Разделы по частям: каждый несёт метку части; ORGS собирается из данных.
  for (const { part, keys } of STRUCTURE) {
    for (const key of keys) {
      const num = String(sections.length + 1).padStart(2, '0')
      const head = (title) =>
        `<div class="sec-head"><span class="sec-part">${esc(t.parts[part])}</span>` +
        `<span class="sec-num">${num}</span><h2>${esc(title)}</h2></div>`

      if (key === 'ORGS') {
        const orgRows = states
          .flatMap((st) =>
            (st.orgs ?? []).map(
              (o) =>
                `<div class="org"><div class="org-h">${esc(st.name[lang])} · ${A(o.href, esc(o.name))}</div><p>${esc(o.note[lang])}</p><span class="url">${esc(o.href)}</span></div>`,
            ),
          )
          .join('')
        sections.push({
          title: t.orgsH,
          part,
          html: `<section>${head(t.orgsH)}<p class="lede">${esc(t.orgsLede)}</p>${orgRows}</section>`,
        })
        continue
      }

      const c = (await import(`../content/${lang}/${key}.ts`)).default
      let body
      if (key === 'journey') {
        body =
          `<p class="lede">${esc(c.lede)}</p>` +
          `<ol class="steps journey">${c.steps.map((st) => `<li><b>${esc(st.t)}</b><br>${inline(st.p)}</li>`).join('')}</ol>` +
          `<h3>${esc(c.tracksTitle)}</h3>` +
          `<ul>${c.tracks.map((st) => `<li><b>${esc(st.t)}</b> — ${inline(st.p)}</li>`).join('')}</ul>` +
          `<p class="dim">${esc(c.note)}</p>`
      } else {
        body = (c.lede ? `<p class="lede">${esc(c.lede)}</p>` : '') + renderBlocks(c.blocks, lang)
      }
      sections.push({
        title: c.title,
        part,
        html:
          `<section>` +
          head(c.title) +
          act(urlFor(lang, key), t.online, 'online') +
          body +
          `<div class="notes"><span>${esc(t.notes)}</span><i></i><i></i><i></i></div>` +
          `</section>`,
      })
    }
  }

  // Оглавление с заголовками частей.
  let toc = ''
  let lastPart = ''
  sections.forEach((sec, i) => {
    if (sec.part !== lastPart) {
      toc += `<li class="toc-part">${esc(t.parts[sec.part])}</li>`
      lastPart = sec.part
    }
    toc += `<li><span class="toc-num">${String(i + 1).padStart(2, '0')}</span>${esc(sec.title)}</li>`
  })

  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
@page { size: Letter; margin: 0; }
* { box-sizing: border-box; }
/* локальные шрифты сайта — без внешних запросов */
@font-face { font-family: 'Archivo'; src: url('../public/fonts/archivo-latin.woff2') format('woff2'); unicode-range: U+0000-00FF, U+2000-206F; }
@font-face { font-family: 'Archivo'; src: url('../public/fonts/archivo-latin-ext.woff2') format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF; }
@font-face { font-family: 'Inter'; src: url('../public/fonts/inter-cyrillic.woff2') format('woff2'); unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116; }
@font-face { font-family: 'JetBrains Mono'; src: url('../public/fonts/jbmono-latin.woff2') format('woff2'); }
:root { --red: #e4382b; --ink: #14181c; --dim: #5c666f; --line: #d7dbdf; --panel: #f4f5f7; --mut: #97a0a8; }
body { font-family: 'Archivo', 'Inter', 'Helvetica Neue', Arial, sans-serif; font-size: 12pt; line-height: 1.55; color: var(--ink); margin: 0; }
a { color: inherit; }
code { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 10pt; background: #eceef0; padding: 0 3pt; border-radius: 3pt; }
.url { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 8.5pt; color: #7a848d; word-break: break-all; }

/* ОБЛОЖКА: тёмная, во всю страницу (композиция по макету Stitch) */
.cover { background: var(--ink); color: #fff; height: 100vh; padding: 18mm 20mm; display: flex; flex-direction: column; page-break-after: always; }
.cov-top { display: flex; justify-content: space-between; align-items: center; border-bottom: 1pt solid rgba(255,255,255,.25); padding-bottom: 10pt; }
.brand { font-size: 15pt; font-weight: 800; letter-spacing: .3em; }
.brand i { display: inline-block; width: 12px; height: 12px; background: var(--red); margin-right: 10px; }
.cov-chip { font-family: 'JetBrains Mono', monospace; font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: var(--mut); border: 1pt solid rgba(255,255,255,.3); border-radius: 99px; padding: 4pt 12pt; }
.cover .mid { margin: auto 0; }
.cover h1 { font-size: 52pt; line-height: 0.95; margin: 0 0 14pt; letter-spacing: -0.02em; text-transform: uppercase; font-weight: 700; }
.cover h1 .mut { color: var(--mut); }
.cover .sub { font-size: 17pt; line-height: 1.35; color: #c3c7cc; margin: 0 0 26pt; max-width: 145mm; }
.chips span { display: inline-block; border: 1.3pt solid rgba(255,255,255,.45); border-radius: 99px; padding: 6pt 16pt; font-size: 9.5pt; font-weight: 700; letter-spacing: .1em; margin: 0 8pt 9pt 0; }
.chips span.hot { border-color: var(--red); color: #ff8d84; }
.chips span.hot::before { content: ''; display: inline-block; width: 6pt; height: 6pt; border-radius: 50%; background: var(--red); margin-right: 7pt; }
.cov-bot { display: flex; justify-content: space-between; align-items: flex-end; gap: 14pt; border-top: 1pt solid rgba(255,255,255,.25); padding-top: 12pt; margin-top: auto; }
.cov-bot .foot { color: var(--mut); font-size: 10pt; max-width: 105mm; margin: 0; }
.cov-bot .site a { color: #fff; font-weight: 700; font-size: 19pt; text-decoration: underline; text-decoration-thickness: 2pt; text-underline-offset: 5pt; white-space: nowrap; }

/* ОГЛАВЛЕНИЕ */
.page { padding: 22mm 20mm; }
.toc { page-break-after: always; }
.kicker { font-family: 'Courier New', monospace; font-size: 9pt; letter-spacing: .18em; text-transform: uppercase; color: var(--red); font-weight: 700; margin-bottom: 6pt; }
.toc h2 { font-size: 24pt; margin: 0 0 14pt; }
.toc ol { list-style: none; padding: 0; margin: 0; }
.toc li { font-size: 13.5pt; font-weight: 600; padding: 8pt 0; border-bottom: 1pt solid var(--line); }
.toc .toc-part { font-family: 'JetBrains Mono', monospace; font-size: 9pt; letter-spacing: .12em; text-transform: uppercase; color: var(--red); font-weight: 700; border-bottom: none; padding: 14pt 0 2pt; }
.toc-num { font-family: 'Courier New', monospace; color: var(--red); font-weight: 700; margin-right: 12pt; font-size: 11pt; }
.toc .meta { margin-top: 18pt; color: var(--dim); font-size: 10pt; line-height: 1.6; }

/* РАЗДЕЛЫ */
section { page-break-before: always; padding: 18mm 20mm 16mm; }
.sec-head { border-bottom: 3pt solid var(--red); padding-bottom: 10pt; margin-bottom: 8pt; }
.sec-part { display: block; font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; letter-spacing: .12em; text-transform: uppercase; color: var(--dim); margin-bottom: 8pt; }
.sec-num { display: block; font-family: 'JetBrains Mono', monospace; font-size: 13pt; font-weight: 700; color: var(--red); letter-spacing: .1em; margin-bottom: 4pt; }
section h2 { font-size: 25pt; margin: 0; line-height: 1.05; letter-spacing: -0.01em; text-transform: uppercase; }
h3 { font-size: 13.5pt; margin: 16pt 0 6pt; text-transform: uppercase; letter-spacing: .02em; }
.lede { color: #444c53; font-size: 12.5pt; margin: 8pt 0 10pt; }
.dim { color: var(--dim); font-size: 10.5pt; }
ul, ol { margin: 5pt 0 10pt; padding-left: 17pt; }
li { margin-bottom: 4.5pt; }
p { margin: 6pt 0; }

/* ссылки-действия: карточка целиком кликабельная,캡с-лейбл + жирный URL */
a.act { display: block; margin: 9pt 0; padding: 10pt 13pt; background: var(--panel); border: 1pt solid var(--line); border-radius: 8pt; break-inside: avoid; text-decoration: none; }
a.act .act-l { display: block; font-size: 9.5pt; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: var(--dim); margin-bottom: 3pt; }
a.act .act-u { display: block; font-weight: 700; font-size: 11.5pt; color: var(--ink); word-break: break-all; }
a.act.online { background: none; border-style: dashed; }

/* линейки для заметок в конце раздела */
.notes { margin-top: 16pt; border-top: 1pt solid var(--ink); padding-top: 7pt; break-inside: avoid; }
.notes span { font-size: 9pt; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--dim); }
.notes i { display: block; border-bottom: 1pt solid var(--ink); height: 16pt; }

/* нумерованные шаги — крупные маркеры */
ol.steps { list-style: none; counter-reset: st; padding-left: 0; }
ol.steps > li { counter-increment: st; position: relative; padding-left: 30pt; margin-bottom: 9pt; }
ol.steps > li::before { content: counter(st); position: absolute; left: 0; top: 1pt; width: 20pt; height: 20pt; border-radius: 50%; background: var(--ink); color: #fff; font-size: 10.5pt; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.steps-t { font-weight: 700; font-size: 12.5pt; margin: 10pt 0 6pt; }
ol.journey > li::before { background: var(--red); }

/* врезки */
.box { border-left: 4pt solid #99a1a8; background: var(--panel); padding: 10pt 13pt; margin: 10pt 0; break-inside: avoid; border-radius: 0 8pt 8pt 0; }
.box.r { border-color: #c62828; background: #fdf1f0; }
.box.y { border-color: #d8a200; background: #fdf8e8; }
.box.g { border-color: #2e7d32; background: #eef7ee; }
.box-t { font-weight: 700; font-size: 10pt; letter-spacing: .07em; text-transform: uppercase; margin-bottom: 4pt; }
.box p { margin: 4pt 0; font-size: 11pt; }

/* карта прав */
.mem { background: #8e130b; color: #fff; padding: 13pt 15pt; border-radius: 10pt; margin: 12pt 0; break-inside: avoid; }
.mem-t { font-size: 9.5pt; letter-spacing: .16em; font-weight: 800; margin-bottom: 7pt; }
.mem p { margin: 5pt 0; font-size: 12pt; line-height: 1.5; }
.mem .alt { border-top: .9pt solid rgba(255,255,255,.35); padding-top: 6pt; font-size: 10pt; color: rgba(255,255,255,.92); }

/* поля для заполнения от руки */
.fields { border: 1.2pt solid #b6bcc2; border-radius: 8pt; padding: 11pt 13pt 4pt; margin: 10pt 0; break-inside: avoid; }
.fields-t { font-family: 'Courier New', monospace; font-size: 9pt; letter-spacing: .14em; text-transform: uppercase; color: var(--dim); margin-bottom: 9pt; font-weight: 700; }
.field { display: flex; align-items: flex-end; gap: 9pt; margin-bottom: 15pt; }
.field span { flex: 0 0 auto; max-width: 58%; font-size: 10.5pt; }
.field i { flex: 1; border-bottom: 1pt solid #6b737a; height: 1pt; }

/* словарь */
.terms .term { break-inside: avoid; padding: 6pt 0; border-bottom: .8pt solid var(--line); }
.terms dt { font-weight: 800; font-size: 11pt; }
.terms dd { margin: 1pt 0 0 0; color: #3c444b; font-size: 10.5pt; }

/* сравнение двух путей */
.cmp { margin: 12pt 0; break-inside: avoid; }
.cmp-g { display: flex; gap: 9pt; }
.cmp-c { flex: 1; border: 1.4pt solid var(--ink); border-radius: 9pt; padding: 10pt 12pt; }
.cmp-h { font-weight: 800; font-size: 13pt; }
.cmp-s { font-family: 'Courier New', monospace; font-size: 8.5pt; letter-spacing: .1em; text-transform: uppercase; color: var(--dim); margin: 2pt 0 6pt; }
.cmp-c ul { margin: 0; padding-left: 13pt; }
.cmp-c li { font-size: 10pt; margin-bottom: 5pt; }

/* организации */
.org { border: 1pt solid var(--line); border-radius: 8pt; padding: 9pt 12pt; margin: 8pt 0; break-inside: avoid; }
.org-h { font-weight: 800; font-size: 12pt; }
.org-h a { text-decoration: none; color: var(--ink); }
.org p { margin: 3pt 0; font-size: 10.5pt; color: #3c444b; }

.footer { padding: 10mm 20mm 14mm; color: var(--dim); font-size: 9.5pt; border-top: 1pt solid var(--line); }
</style></head><body>
<div class="cover">
  <div class="cov-top"><div class="brand"><i></i>DETNAV</div><span class="cov-chip">${esc(t.edition)}</span></div>
  <div class="mid">
    <h1>${esc(t.cover1a)}<br><span class="mut">${esc(t.cover1b)}</span></h1>
    <p class="sub">${esc(t.cover2)}</p>
    <div class="chips">${t.chips.map((c, i) => `<span${i === t.chips.length - 1 ? ' class="hot"' : ''}>${esc(c)}</span>`).join('')}</div>
  </div>
  <div class="cov-bot"><p class="foot">${esc(t.coverNote)}</p><div class="site">${A(`${ORIGIN}/${lang}/`, `detnav.com/${lang}/`)}</div></div>
</div>
<div class="page toc">
  <div class="kicker">DETNAV</div>
  <h2>${esc(t.toc)}</h2>
  <ol>${toc}</ol>
  <p class="meta">${esc(ui.updated)}<br>${esc(t.disclaimer)}</p>
</div>
${sections.map((s) => s.html).join('\n')}
<div class="footer">${esc(ui.disclaimer)} · ${esc(ui.updatedShort)} · ${A(ORIGIN, 'detnav.com')}</div>
</body></html>`

  mkdirSync(OUT, { recursive: true })
  const htmlPath = join(OUT, `detnav-playbook-${lang}.html`)
  const pdfPath = join(OUT, `detnav-playbook-${lang}.pdf`)
  writeFileSync(htmlPath, html)
  execFileSync(
    CHROMIUM,
    ['--headless', '--no-sandbox', '--disable-gpu', `--print-to-pdf=${pdfPath}`, '--no-pdf-header-footer', '--generate-pdf-document-outline', `file://${htmlPath}`],
    { stdio: 'pipe' },
  )
  console.log(`gen-playbook: ${pdfPath}`)
}

const langs = process.argv[2] ? [process.argv[2]] : ['ru', 'en', 'es']
for (const l of langs) await build(l)
