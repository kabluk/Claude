#!/usr/bin/env node
// Собирает печатный плейбук DETNAV (PDF) из контента сайта — по одному
// файлу на язык. Контент не дублируется: генератор читает те же
// content/<lang>/*.ts, что и сайт, поэтому плейбук всегда совпадает
// с опубликованным текстом (и проходит те же UPL-линтеры).
//
// Запуск:  node --experimental-strip-types scripts/gen-playbook.mjs [en|es|ru]
// Выход:   dist-playbook/detnav-playbook-<lang>.pdf (+ .html рядом для правок)
// PDF печатает headless Chromium (--print-to-pdf), без Playwright.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = join(ROOT, 'dist-playbook')
const CHROMIUM = '/opt/pw-browsers/chromium'
const ORIGIN = 'https://detnav.com'

const slugs = JSON.parse(readFileSync(join(ROOT, 'content/slugs.json'), 'utf8'))
const states = JSON.parse(readFileSync(join(ROOT, 'data/states.json'), 'utf8'))
const urlFor = (lang, key) =>
  `${ORIGIN}/${lang}/${slugs[key]?.[lang] ? slugs[key][lang] + '/' : ''}`

// Страницы сайта, из которых собирается плейбук, в порядке следования.
const PAGES = ['where', 'firstcall', 'prepare', 'journey', 'habeas', 'glossary']

// Собственные строки плейбука (обложка, оглавление, подписи).
const T = {
  ru: {
    cover1: 'Плейбук семьи',
    cover2: 'Если человека задержала иммиграционная служба США',
    chips: ['БЕСПЛАТНО НА САЙТЕ', 'БЕЗ РЕГИСТРАЦИИ', 'EN · ES · RU', 'ZERO-DATA'],
    coverNote:
      'Печатная версия материалов detnav.com. Всё то же самое — бесплатно и всегда свежее — на сайте. Правила меняются: сверяйте дату внизу страниц.',
    toc: 'Что внутри',
    online: 'Эта страница на сайте',
    links: 'Официальные ссылки из этого раздела',
    orgsH: 'Организации помощи по штатам',
    disclaimer:
      'Мы не адвокаты и не даём юридических консультаций. Здесь только факты и ссылки на официальные источники. Что применимо к конкретному делу — определяет адвокат.',
  },
  en: {
    cover1: 'The Family Playbook',
    cover2: 'When someone is detained by U.S. immigration',
    chips: ['FREE ON THE SITE', 'NO SIGN-UP', 'EN · ES · RU', 'ZERO-DATA'],
    coverNote:
      'A printable edition of detnav.com. Everything here is free and always current on the site. Rules change — check the date at the bottom of each page.',
    toc: 'What is inside',
    online: 'This page online',
    links: 'Official links from this section',
    orgsH: 'Help organizations by state',
    disclaimer:
      'We are not attorneys and we do not give legal advice. Only facts and links to official sources. What applies to a specific case is for an attorney to determine.',
  },
  es: {
    cover1: 'El playbook de la familia',
    cover2: 'Cuando inmigración detiene a una persona en EE. UU.',
    chips: ['GRATIS EN EL SITIO', 'SIN REGISTRO', 'EN · ES · RU', 'ZERO-DATA'],
    coverNote:
      'Edición imprimible de detnav.com. Todo esto está gratis y siempre actualizado en el sitio. Las reglas cambian — mire la fecha al pie de las páginas.',
    toc: 'Qué hay adentro',
    online: 'Esta página en el sitio',
    links: 'Enlaces oficiales de esta sección',
    orgsH: 'Organizaciones de ayuda por estado',
    disclaimer:
      'No somos abogados y no damos asesoría legal. Solo hechos y enlaces a fuentes oficiales. Qué aplica a un caso concreto lo determina un abogado.',
  },
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// `код` → <code>, как Inline на сайте.
const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>')

function renderBlocks(blocks, lang, bag) {
  let h = ''
  for (const b of blocks) {
    switch (b.kind) {
      case 'h2':
        h += `<h3>${inline(b.text)}</h3>`
        break
      case 'p':
        h += `<p class="${b.dim ? 'dim' : ''}">${inline(b.text)}</p>`
        break
      case 'list':
        h += `<ul>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>`
        break
      case 'steps':
        h += (b.title ? `<p class="steps-t">${inline(b.title)}</p>` : '') +
          `<ol>${b.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ol>`
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
          .map((it) => `<dt>${inline(it.term)}</dt><dd>${inline(it.def)}</dd>`)
          .join('')}</dl>`
        break
      case 'compare':
        h += `<div class="cmp">${b.title ? `<div class="cmp-t">${esc(b.title)}</div>` : ''}<div class="cmp-g">${[b.a, b.b]
          .map(
            (c) =>
              `<div class="cmp-c"><div class="cmp-h">${esc(c.h)}</div><div class="cmp-s">${esc(c.sub)}</div><ul>${c.rows
                .map((r) => `<li>${inline(r)}</li>`)
                .join('')}</ul></div>`,
          )
          .join('')}</div>${b.note ? `<p class="dim">${esc(b.note)}</p>` : ''}</div>`
        break
      case 'ext':
        bag.links.push({ label: b.label, href: b.href })
        break
      case 'onward':
        for (const s of b.sources ?? []) bag.links.push({ label: s.label, href: s.href })
        break
      case 'ilink': {
        // Внутренние ссылки в печати — адресом сайта.
        h += `<p class="site">→ ${esc(b.label)} · <span class="url">${urlFor(lang, b.page)}</span></p>`
        break
      }
      // интерактивные инструменты в печать не попадают
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

  for (const key of PAGES) {
    const c = (await import(`../content/${lang}/${key}.ts`)).default
    const bag = { links: [] }
    let body
    if (key === 'journey') {
      body =
        `<p class="lede">${esc(c.lede)}</p>` +
        `<ol class="journey">${c.steps.map((s) => `<li><b>${esc(s.t)}</b> — ${inline(s.p)}</li>`).join('')}</ol>` +
        `<h3>${esc(c.tracksTitle)}</h3>` +
        `<ul>${c.tracks.map((s) => `<li><b>${esc(s.t)}</b> — ${inline(s.p)}</li>`).join('')}</ul>` +
        `<p class="dim">${esc(c.note)}</p>`
    } else {
      body = (c.lede ? `<p class="lede">${esc(c.lede)}</p>` : '') + renderBlocks(c.blocks, lang, bag)
    }
    const links = (bag?.links ?? []).length
      ? `<div class="linkbox"><div class="linkbox-t">${t.links}</div>${bag.links
          .map((l) => `<p>${esc(l.label)}<br><span class="url">${esc(l.href)}</span></p>`)
          .join('')}</div>`
      : ''
    sections.push({
      title: c.title,
      html:
        `<section><h2>${esc(c.title)}</h2><p class="site">${t.online}: <span class="url">${urlFor(lang, key)}</span></p>` +
        body +
        links +
        `</section>`,
    })
  }

  // Приложение: организации по штатам.
  const orgRows = states
    .flatMap((s) =>
      (s.orgs ?? []).map(
        (o) =>
          `<p><b>${esc(s.name[lang])} · ${esc(o.name)}</b><br>${esc(o.note[lang])}<br><span class="url">${esc(o.href)}</span></p>`,
      ),
    )
    .join('')
  sections.push({
    title: T[lang].orgsH,
    html: `<section><h2>${esc(t.orgsH)}</h2>${orgRows}</section>`,
  })

  const toc = sections.map((s, i) => `<li>${esc(s.title)}</li>`).join('')

  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
@page { size: Letter; margin: 18mm 16mm 20mm; }
* { box-sizing: border-box; }
body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #14181c; margin: 0; }
code, .url { font-family: 'Courier New', monospace; font-size: 9.5pt; }
.url { color: #444; word-break: break-all; }
.cover { height: 88vh; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }
.brand { font-size: 13pt; font-weight: 800; letter-spacing: .3em; }
.brand i { display: inline-block; width: 10px; height: 22px; background: #e4382b; margin-right: 10px; vertical-align: -4px; }
.cover h1 { font-size: 30pt; line-height: 1.15; margin: 18pt 0 6pt; }
.cover .sub { font-size: 14pt; color: #444; margin: 0 0 22pt; }
.chips span { display: inline-block; border: 1.2pt solid #14181c; border-radius: 99px; padding: 3pt 10pt; font-size: 8pt; font-weight: 700; letter-spacing: .08em; margin: 0 6pt 6pt 0; }
.cover .note { color: #555; max-width: 130mm; }
.toc { page-break-after: always; }
.toc h2 { font-size: 16pt; }
.toc ol { font-size: 12pt; line-height: 2; }
section { page-break-before: always; }
section h2 { font-size: 17pt; border-bottom: 2.5pt solid #e4382b; padding-bottom: 5pt; margin: 0 0 4pt; }
h3 { font-size: 12.5pt; margin: 14pt 0 5pt; }
.lede { color: #444; font-size: 11pt; margin: 4pt 0 10pt; }
.dim { color: #666; font-size: 9.5pt; }
.site { color: #555; font-size: 9pt; margin: 2pt 0 8pt; }
ul, ol { margin: 4pt 0 8pt; padding-left: 16pt; }
li { margin-bottom: 3pt; }
.steps-t { font-weight: 700; margin: 8pt 0 2pt; }
.box { border-left: 3pt solid #999; background: #f4f5f6; padding: 7pt 10pt; margin: 8pt 0; break-inside: avoid; border-radius: 0 6pt 6pt 0; }
.box.r { border-color: #c62828; background: #fdf1f0; }
.box.y { border-color: #d8a200; background: #fdf8e8; }
.box.g { border-color: #2e7d32; background: #eef7ee; }
.box-t { font-weight: 700; margin-bottom: 3pt; }
.box p { margin: 3pt 0; }
.mem { background: #8e130b; color: #fff; padding: 10pt 12pt; border-radius: 8pt; margin: 10pt 0; break-inside: avoid; }
.mem-t { font-size: 8.5pt; letter-spacing: .14em; font-weight: 700; margin-bottom: 5pt; }
.mem p { margin: 4pt 0; font-size: 10pt; }
.mem .alt { border-top: .8pt solid rgba(255,255,255,.35); padding-top: 5pt; font-size: 9pt; color: rgba(255,255,255,.92); }
.fields { border: 1pt solid #bbb; border-radius: 6pt; padding: 9pt 11pt 3pt; margin: 8pt 0; break-inside: avoid; }
.fields-t { font-size: 8.5pt; letter-spacing: .12em; text-transform: uppercase; color: #666; margin-bottom: 7pt; font-weight: 700; }
.field { display: flex; align-items: flex-end; gap: 8pt; margin-bottom: 12pt; }
.field span { flex: 0 0 auto; max-width: 60%; font-size: 9.5pt; }
.field i { flex: 1; border-bottom: .8pt solid #888; height: 1pt; }
.terms dt { font-weight: 700; font-family: 'Courier New', monospace; font-size: 9.5pt; margin-top: 6pt; }
.terms dd { margin: 1pt 0 0 0; color: #333; font-size: 9.5pt; }
.cmp { margin: 10pt 0; break-inside: avoid; }
.cmp-t { font-size: 8.5pt; letter-spacing: .12em; text-transform: uppercase; color: #666; font-weight: 700; margin-bottom: 5pt; }
.cmp-g { display: flex; gap: 8pt; }
.cmp-c { flex: 1; border: 1pt solid #bbb; border-radius: 6pt; padding: 8pt 10pt; }
.cmp-h { font-weight: 800; font-size: 11pt; }
.cmp-s { font-size: 8pt; letter-spacing: .08em; text-transform: uppercase; color: #666; margin: 1pt 0 5pt; }
.cmp-c ul { margin: 0; padding-left: 12pt; }
.cmp-c li { font-size: 9pt; margin-bottom: 4pt; }
.linkbox { border: 1pt dashed #999; border-radius: 6pt; padding: 8pt 10pt; margin-top: 10pt; break-inside: avoid; }
.linkbox-t { font-size: 8.5pt; letter-spacing: .12em; text-transform: uppercase; color: #666; font-weight: 700; margin-bottom: 4pt; }
.linkbox p { margin: 3pt 0; font-size: 9pt; }
.footer { margin-top: 14pt; padding-top: 8pt; border-top: 1pt solid #ccc; color: #666; font-size: 8.5pt; }
</style></head><body>
<div class="cover">
  <div class="brand"><i></i>DETNAV</div>
  <h1>${esc(t.cover1)}</h1>
  <p class="sub">${esc(t.cover2)}</p>
  <div class="chips">${t.chips.map((c) => `<span>${esc(c)}</span>`).join('')}</div>
  <p class="note">${esc(t.coverNote)}</p>
  <p class="note url">${ORIGIN}/${lang}/</p>
</div>
<div class="toc"><h2>${esc(t.toc)}</h2><ol>${toc}</ol>
  <p class="dim" style="margin-top:14pt">${esc(ui.updated)}</p>
  <p class="dim">${esc(t.disclaimer)}</p>
</div>
${sections.map((s) => s.html).join('\n')}
<div class="footer">${esc(ui.disclaimer)} · ${esc(ui.updatedShort)} · ${ORIGIN}</div>
</body></html>`

  mkdirSync(OUT, { recursive: true })
  const htmlPath = join(OUT, `detnav-playbook-${lang}.html`)
  const pdfPath = join(OUT, `detnav-playbook-${lang}.pdf`)
  writeFileSync(htmlPath, html)
  execFileSync(CHROMIUM, [
    '--headless', '--no-sandbox', '--disable-gpu',
    `--print-to-pdf=${pdfPath}`, '--no-pdf-header-footer',
    `file://${htmlPath}`,
  ], { stdio: 'pipe' })
  console.log(`gen-playbook: ${pdfPath}`)
}

const langs = process.argv[2] ? [process.argv[2]] : ['ru', 'en', 'es']
for (const l of langs) await build(l)
