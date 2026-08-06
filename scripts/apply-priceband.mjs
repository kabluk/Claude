#!/usr/bin/env node
// G-PRICE (D-045): проставляет priceBand ТОЛЬКО там, где агентство само
// опубликовало цену своего аудита доступности, и кладёт рядом источник —
// URL страницы с ценой + дословную цитату цены в label.
//
// Разовый скрипт-патч: правило маппинга и полный журнал решений — в
// docs/project/DECISIONS.md (D-045) и docs/project/domains/data.md.
// Ничего не выдумывает: каждая запись ниже — результат ручной проверки
// страницы агентства (см. `quote`), а не оценки «на глаз».

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FILE = join(ROOT, 'data/a11y/agencies.json')

// band — вычислен по правилу D-045 из `quote` (цитата с той самой страницы).
const UPDATES = [
  // --- уже стояли до G-PRICE: значение подтверждено, добавлен источник цены ---
  {
    slug: 'wcag-audyt-pl',
    band: 'budget',
    url: 'https://wcag-audyt.pl/cennik/',
    label: 'cennik: "Audyt Dostępności 7399 PLN / 8499 PLN" (WCAG 2.1+2.2 A/AA, netto) ≈ €1.7–2.0k; checked 2026-08-06',
  },
  {
    slug: 'audyt-dostepnosci-pl',
    band: 'budget',
    url: 'https://audyt-dostepnosci.pl/cennik-audytu-dostepnosci/',
    label: 'cennik: "Audyt Podstawowy 2 500 zł netto", "Audyt Rozszerzony 5 000 zł netto" ≈ €590–1.2k; checked 2026-08-06',
  },
  {
    slug: 'eclusief',
    band: 'budget',
    url: 'https://normeris.nl/diensten/wcag-onderzoek/',
    label: 'prijzen (бренд Normeris): "WCAG-onderzoek … € 1.950,-", "Quickscan … € 595,-"; checked 2026-08-06',
  },
  {
    slug: 'abilitynet',
    band: 'mid',
    url: 'https://abilitynet.org.uk/accessibility-services/products-and-services/accessibility-audit',
    label: 'audit page: "our entry-level Digital Accessibility Review is a fixed £4,950 +VAT for up to 10 key pages/components" ≈ €5.8k; checked 2026-08-06',
  },

  // --- найдено в G-PRICE ---
  {
    slug: 'reddog-systems',
    band: 'budget',
    url: 'https://red-dog.pl/dostepnosc-cyfrowa/',
    label: '"Ile kosztuje audyt dostępności? 1 350 zł" (z VAT, do 30 podstron) ≈ €320; checked 2026-08-06',
  },
  {
    slug: 'anysurfer',
    band: 'budget',
    url: 'https://www.anysurfer.be/nl/diensten/audits',
    label: 'audits: "Klein: 1250€ voor eerste audit … Standaard: 2500€ … Complex: 4000€"; checked 2026-08-06',
  },
  {
    slug: 'auditores-accesibilidad',
    band: 'budget',
    url: 'https://auditoresaccesibilidad.com/servicios-accesibilidad-digital/',
    label: 'servicios: "Full Audit … desde 600€" (auditoría manual completa), "Quick Scan … desde 300€"; checked 2026-08-06',
  },
  {
    slug: 'purin',
    band: 'budget',
    url: 'https://www.purin.at/leistungen/webentwicklung-barrierefreiheit/',
    label: '"EAA-Audit ab 540 €" / "Barrierefreiheits-Audit ab 540 € · bis zu 3 Seiten · exkl. MwSt."; checked 2026-08-06',
  },
  {
    slug: 'damteq',
    band: 'budget',
    url: 'https://www.damteq.co.uk/marketing/ux/accessibility-audits/',
    label: '"Typically, a one-off Accessibility Audit will start from £1,650 +VAT" ≈ €1.9k; checked 2026-08-06',
  },
  {
    slug: 'access42',
    band: 'mid',
    url: 'https://access42.net/services/audit-accessibilite/',
    label: '"Audit de conformité web : entre 1 800 € et 5 600 € HT" (mobile 1 600–2 800 € HT); checked 2026-08-06',
  },
  {
    slug: 'boscop',
    band: 'mid',
    url: 'https://boscop.fr/audit-rgaa-wcag/',
    label: 'audit RGAA/WCAG «Initier»: "Prix indicatif : de 2000€ à 6000€ HT"; checked 2026-08-06',
  },
  {
    slug: 'accessprod',
    band: 'mid',
    url: 'https://www.accessprod.com/prestations/audits/',
    label: '"L\'audit RGAA détaillé … Tarif : de 2 100€ HT à 4 900€ HT"; checked 2026-08-06',
  },
  {
    slug: 'jim-byrne-associates',
    band: 'mid',
    url: 'https://jimbyrne.co.uk/accessibility-testing-auditing/',
    label: '"Costs start at £2500 for a full WCAG 2.2 audit … Costs are in the region of £2500 / £4000" ≈ €3.8k; checked 2026-08-06',
  },
  {
    slug: 'rockit',
    band: 'mid',
    url: 'https://www.rockit.at/leistungen/barrierefreiheits-analyse',
    label: '"Quickcheck … startet bei etwa 1.500 Euro. Vollaudits grösserer Sites mit Konformitätserklärung bewegen sich zwischen 4.000 und 12.000 Euro"; checked 2026-08-06 (live-страница за анти-бот защитой, текст снят прямым HTTP-запросом)',
  },
  {
    slug: 'nettkonsult',
    band: 'mid',
    url: 'https://nettkonsult.no/tjeneste/universell-utforming/',
    label: '"En WCAG-revisjon for en enkel nettside starter fra 1 300–2 600 EUR. Større webapplikasjoner og portaler kan koste 4 500–13 000 EUR"; checked 2026-08-06',
  },
  {
    slug: 'skynet-technologies',
    band: 'mid',
    url: 'https://www.skynettechnologies.com/website-accessibility-audit',
    label: 'manual audit tiers: "5 Pages / 2 Templates $500 … 100 Pages / 40 Templates $12,500" ≈ €460–11.5k; checked 2026-08-06',
  },
  {
    slug: 'level-level',
    band: 'mid',
    url: 'https://level-level.com/accessibility/diensten/audits/',
    label: 'audits: "WCAG Audit … €2.450,-", "WCAG Audit + … Vanaf €4.500,-" (Quickscan €875,-); checked 2026-08-06 по архивной копии — живая страница отдаёт 403 автоматике',
  },
]

const agencies = JSON.parse(readFileSync(FILE, 'utf8'))
const bySlug = new Map(agencies.map((a) => [a.slug, a]))
let changedBand = 0
let addedRef = 0
let updatedRef = 0

for (const u of UPDATES) {
  const a = bySlug.get(u.slug)
  if (!a) throw new Error(`unknown slug: ${u.slug}`)
  if (a.priceBand !== u.band) {
    a.priceBand = u.band
    changedBand++
  }
  const existing = (a.sourceRefs || []).find((r) => r.url === u.url)
  if (existing) {
    if (existing.label !== u.label) {
      existing.label = u.label
      updatedRef++
    }
  } else {
    a.sourceRefs.push({ url: u.url, label: u.label })
    addedRef++
  }
}

writeFileSync(FILE, JSON.stringify(agencies, null, 2) + '\n')
const withBand = agencies.filter((a) => a.priceBand)
console.log(
  `priceBand: ${withBand.length}/${agencies.length} записей ` +
    `(изменено ${changedBand}, источников добавлено ${addedRef}, уточнено ${updatedRef})`,
)
for (const b of ['budget', 'mid', 'premium', 'enterprise']) {
  console.log(`  ${b}: ${agencies.filter((a) => a.priceBand === b).length}`)
}
