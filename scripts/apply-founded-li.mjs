#!/usr/bin/env node
// G-FOUNDED-LI (D-051, продолжение D-047): проставляет `founded` для записей
// из очереди `founded == null`, проверенных ГЛУБЖЕ первого прохода (Impressum,
// торговый реестр, страницы истории, footer — не только homepage+About).
//
// Разовый скрипт-патч по образцу scripts/apply-founded.mjs. Правило отбора —
// то же (D-047: явная формулировка основания ОРГАНИЗАЦИИ, не деятельности;
// LinkedIn не самостоятельный источник). Журнал по пакетам — docs/project/
// domains/data.md, полный список принятых/отклонённых — DECISIONS.md.
//
// Первый пакет (20 записей, 6 принято) — уже применён в 7bb714c. Это —
// пакеты 3,6,7,8,9 из повторного прохода 2026-08-07 (80 записей, 21 принято).

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FILE = join(ROOT, 'data/a11y/agencies.json')
const CHECKED = 'checked 2026-08-07'

const UPDATES = [
  {
    slug: 'sernicola-labs',
    year: 2015,
    refs: [{ url: 'https://www.sernicola-labs.com/', label: 'schema.org JSON-LD (homepage source): "...software house con sede a Milano, fondata nel 2015..." + foundingDate:"2015"; ' + CHECKED }],
  },
  {
    slug: 'gmg-net',
    year: 2000,
    refs: [{ url: 'https://www.gmgnet.com/digital-agency-genova/', label: 'Chi siamo, timeline: "2000 - Nasce Gmg Net da un\'idea di Luca e Giuseppe"; ' + CHECKED }],
  },
  {
    slug: 'myability',
    year: 2014,
    refs: [{ url: 'https://www.myability.org/ueber-uns/ueber-myability', label: 'Über myAbility: "2014 gründeten sie dann gemeinsam mit Sandra Edelmann und Michael Aumann die soziale Unternehmensberatung myAbility."; ' + CHECKED }],
  },
  {
    slug: 'anysurfer',
    year: 2001,
    refs: [{
      url: 'https://www.anysurfer.be/nl/contact/geschiedenis',
      label:
        'Geschiedenis-pagina: "Op 18 april 2001 werden het project, het bijbehorende kwaliteitslabel en de eerste toegankelijke websites voorgesteld aan de pers." — oprichting onder de oorspronkelijke naam BlindSurfer (in 2006 alleen hernoemd tot AnySurfer); ' +
        CHECKED +
        '. Herroept D-047\'s CLEAR-oordeel (toen was alleen de homepage-tekst "Sinds 2001 helpen we organisaties" bekend — activiteitswoorden; de geschiedenispagina toont de daadwerkelijke oprichting).',
    }],
  },
  {
    slug: 'etu',
    year: 1995,
    refs: [{ url: 'https://etu.se/etu/', label: 'Om ETU, "Så började ETU-resan": "Vi startade ETU 1995, med visionen att göra entreprenörskap, tillgänglighet och utbildning på ett annorlunda sätt."; ' + CHECKED }],
  },
  {
    slug: 'accessability-officer',
    year: 2021,
    refs: [{ url: 'https://accessabilityofficer.com/about/', label: 'About (Meet the Founder): "Before founding AccessAbility Officer in 2021 and launching the Certified AccessAbility Testing Program in 2022..."; ' + CHECKED }],
  },
  {
    slug: 'x-com',
    year: 2000,
    refs: [{
      url: 'https://www.x-com.nl/over-ons/geschiedenis/',
      label: 'Geschiedenis-tijdlijn ("2000: Oprichting X-com", inhoud JS-gerenderd uit x-com.nl/timeline.json): "In 2000 richten partners Bas Peters en Wim van der Wouw gezamenlijk X-com op aan de markt in Baarlo."; ' + CHECKED,
    }],
  },
  {
    slug: 'chent',
    year: 2018,
    refs: [{ url: 'https://www.chent.nl/over-chent/', label: 'Over Chent, "Onze achtergrond": "Chent is in 2018 opgericht vanuit een commerciële en technische basis."; ' + CHECKED }],
  },
  {
    slug: 'frameless',
    year: 2013,
    refs: [{ url: 'https://frameless.io/', label: 'Homepage (single-page site): "Sinds de oprichting van Frameless in 2013 hebben we diverse opdrachten mogen doen"; ' + CHECKED }],
  },
  {
    slug: 'inter-vlaanderen',
    year: 2014,
    refs: [{
      url: 'https://www.vlaanderen.be/inter/over-inter/het-agentschap-inter',
      label:
        '"Inter werd opgericht via het Vlaamse machtigingsdecreet van 28 maart 2014." (officiële oprichting per decreet; op 1 mei 2015 gingen de vijf voorloper-vzw\'s operationeel op in het agentschap); ' + CHECKED,
    }],
  },
  {
    slug: 'fondazione-lia',
    year: 2014,
    refs: [{
      url: 'https://www.fondazionelia.org/chi-siamo/fondazione/',
      label: '"Nel 2014, per raccogliere l\'eredità del progetto e garantirne la sua continuità nel tempo, AIE ha quindi costituito Fondazione LIA." (il progetto LIA è iniziato nel 2011, la fondazione è del 2014); ' + CHECKED,
    }],
  },
  {
    slug: 'pluspol-interactive',
    year: 2002,
    refs: [{
      url: 'https://pluspol-interactive.de/agentur/',
      label: 'Agentur-Seite: "2002 als Start-up von Jörg Brückner, Stefan Dittmar und Thomas Lange an der Hochschule Mittweida gegründet, entwickelte sich PLUSPOL interactive schnell zu einer professionellen Digitalagentur"; ' + CHECKED,
    }],
  },
  {
    slug: 'brain-appeal',
    year: 1998,
    refs: [{
      url: 'https://www.brain-appeal.com/typo3-agentur-mannheim/20-jahre-firmengeschichte',
      label: 'Firmengeschichte, Eintrag "1998" markiert "Das Gründerjahr!" (das Einzelunternehmen METEOS Deutschland wurde 2013 zur Brain Appeal GmbH — Rechtsformwechsel, die Seite selbst nennt 1998 als Gründungsjahr); ' + CHECKED,
    }],
  },
  {
    slug: 'bikosax',
    year: 1894,
    refs: [{
      url: 'https://www.dzblesen.de/ueber-uns/das-zentrum/geschichte',
      label:
        'bikosax.de leitet weiter auf www.dzblesen.de — BIKOSAX ist ein Dienst der dzb lesen (Deutsches Zentrum für barrierefreies Lesen), keine andere Organisation. Geschichte-Seite: "Am 12. November 1894 gegründet und als Deutsche Zentralbücherei für Blinde (DZB) bekannt, ist das Haus seit 130 Jahren Bibliothek für blinde und sehbehinderte Menschen"; ' +
        CHECKED,
    }],
  },
  {
    slug: 'interface-consult',
    year: 1994,
    refs: [{ url: 'https://www.usability.at/ueberuns/index.html', label: 'Über uns: "Interface Consult wurde 1994 als Universitäts Spin-Off durch Dr. Martina Manhartsberger ... gegründet."; ' + CHECKED }],
  },
  {
    slug: 'mstage',
    year: 2012,
    refs: [{ url: 'https://mstage.at/unsere-geschichte', label: 'Unsere Geschichte, Abschnitt "mStage GmbH": "2012 wurde mStage auf Gesellschaftern mit langjähriger Erfahrung in Web- und CRM-Dienstleistungen gegründet"; ' + CHECKED }],
  },
  {
    slug: 'alsacreations',
    year: 2006,
    refs: [{
      url: 'https://www.alsacreations.fr/timeline',
      label: 'Notre histoire, sous le titre "2006 : Le lancement": "Création officielle de l\'agence. On démarre avec deux PC, une imprimante, des chats, et beaucoup de rêves."; ' + CHECKED,
    }],
  },
  {
    slug: 'ebizproduction',
    year: 1998,
    refs: [{
      url: 'https://www.bluedrop.fr/l-agence-drupal',
      label: 'Page agence, tuile chiffrée: "1998" avec la légende "Année de création" (corroboré par la frise "Création de la société — Création de l\'agence à Marseille et Beyrouth, par les 3 associés actuels" et "28 ans d\'histoire"); ' + CHECKED,
    }],
  },
  {
    slug: 'eclydre',
    year: 1993,
    refs: [{ url: 'https://www.eclydre.fr/agence', label: 'Page agence: "Eclydre est une agence web indépendante fondée en 1993."; ' + CHECKED }],
  },
  {
    slug: 'lorweb',
    year: 1997,
    refs: [{ url: 'https://lorweb.group/lorweb', label: 'Page histoire: "Fondé en 1997 par Jean-Philippe Brechon, Lorweb Group s\'est rapidement imposé..."; "Lorweb Group est né officiellement en 1997"; ' + CHECKED }],
  },
  {
    slug: 'net-15',
    year: 1997,
    refs: [{ url: 'https://www.net15.fr/presentation-histoire-societe-15-cantal', label: 'Frise historique de la société: "1997 – La création de Net15", suivi de "L\'aventure Net15 commence."; ' + CHECKED }],
  },
]

const agencies = JSON.parse(readFileSync(FILE, 'utf8'))
const bySlug = new Map(agencies.map((a) => [a.slug, a]))
let setYear = 0
let changedYear = 0
let addedRef = 0

for (const u of UPDATES) {
  const a = bySlug.get(u.slug)
  if (!a) throw new Error(`unknown slug: ${u.slug}`)
  if (a.founded == null) setYear++
  else if (a.founded !== u.year) changedYear++
  a.founded = u.year
  for (const r of u.refs) {
    const existing = (a.sourceRefs || []).find((x) => x.url === r.url)
    if (existing) {
      if (!existing.label.includes(r.label)) existing.label = `${existing.label} · founded: ${r.label}`
    } else {
      a.sourceRefs = a.sourceRefs || []
      a.sourceRefs.push({ url: r.url, label: r.label })
      addedRef++
    }
  }
}

writeFileSync(FILE, JSON.stringify(agencies, null, 2) + '\n')
console.log(`G-FOUNDED-LI batch: ${setYear} set, ${changedYear} changed, ${addedRef} refs added, ${UPDATES.length} records total`)
