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
// Первый пакет (20 записей, 6 принято) — уже применён в 7bb714c. Второй блок —
// пакеты 3,6,7,8,9 из повторного прохода 2026-08-07 (80 записей, 21 принято).
// Третий блок (D-053) — пакеты 11-15, вторая попытка (первая сорвалась на API
// session limit, повторный запуск был прерван пользовательским interrupt
// посреди работы — обе попытки не дали ни одной записи; перезапущены с нуля
// третий раз, 80/80 записей дошли до конца). 17 из 80 приняты, все проверены
// живьём (deterministic fetch + поиск дословной цитаты) перед применением.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FILE = join(ROOT, 'data/a11y/agencies.json')
const CHECKED = 'checked 2026-08-07'
const CHECKED3 = 'checked 2026-08-07 (пакеты 11-15, третий запуск)'

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

  // --- Третий блок (D-053), пакеты 11-15, 17 записей — полный журнал domains/data.md ---
  {
    slug: 'deutsche-telekom-mms',
    year: 1995,
    refs: [{
      url: 'https://www.telekom-mms.com/blog/artikel/detail/30-jahre-telekom-mms-von-der-mutigen-idee-zur-digitalen-erfolgsgeschichte',
      label: 'Corporate blog: "Vor 30 Jahren, am 9. Januar 1995, wurde unser Unternehmen als „Multimedia Software GmbH Dresden" mit einem Eintrag ins Handelsregister offiziell gegründet." (Vorgänger, später T-Systems Multimedia Solutions / Deutsche Telekom MMS); ' + CHECKED3,
    }],
  },
  {
    slug: 'anatom5',
    year: 2003,
    refs: [{
      url: 'https://anatom5.de/agentur/grundsatz',
      label: '"Als wir 2003 anatom5 gegründet haben, stand digitale Barrierefreiheit kaum auf der Agenda" — пересматривает CLEAR из D-047 (тогда видели только "seit 2003" на главной); ' + CHECKED3,
    }],
  },
  {
    slug: 'hcltech',
    year: 1976,
    refs: [{ url: 'https://www.hcltech.com/about-us', label: '"Our Journey" timeline, запись 1976: "HCL is founded as one of the original tech, computing and engineering startups of India"; ' + CHECKED3 }],
  },
  {
    slug: 'barrierbreak',
    year: 2004,
    refs: [{
      url: 'https://www.barrierbreak.com/accessibility-barrierbreak/',
      label: '"...an accessibility testing and consulting company based in India, founded in the year 2004 with a strong belief that that technology can empower people with disabilities..."; ' + CHECKED3,
    }],
  },
  {
    slug: 'braille-institute-access-solutions',
    year: 1919,
    refs: [{
      url: 'https://www.brailleinstitute.org/about-us/history/',
      label: 'History: "...founded the Universal Braille Press in 1919, which was later incorporated as Braille Institute of America, Inc."; ' + CHECKED3,
    }],
  },
  {
    slug: 'proper-access',
    year: 2019,
    refs: [{ url: 'https://www.properaccess.nl/auditbureau-digitale-toegankelijkheid/', label: '"Opgericht in 2019, 900+ audits uitgevoerd"; ' + CHECKED3 }],
  },
  {
    slug: 'cardan',
    year: 2002,
    refs: [{
      url: 'https://www.cardan.com/over-cardan',
      label: '"Wij zijn in 2002 ontstaan om mensen die zelfstandig lastiger aan een baan kunnen komen, een kans te geven om zich verder te ontwikkelen." (specialisatie in digitale toegankelijkheid sinds 2016, zelfde organisatie); ' + CHECKED3,
    }],
  },
  {
    slug: 'digitelle',
    year: 2016,
    refs: [{
      url: 'https://digitelle.no/om-oss/',
      label: '"...startet han Digitelle i 2016..." + footer "Etablert i 2016, med over 20 års WordPress-erfaring."; ' + CHECKED3,
    }],
  },
  {
    slug: 'avaava',
    year: 2017,
    refs: [{
      url: 'https://avaava.fi/yritys/yritystarina',
      label: '"Vuonna 2017 perustettiin Avaava Digital Oy yhdessä hallituksen puheenjohtajan Petteri Alinikulan kanssa." (Avaava-merkki syntyi 2009 emoyhtiö Karanttia Oy:n sisällä, yhtiöitettiin Avaava Digital Oy:ksi 2017); ' + CHECKED3,
    }],
  },
  {
    slug: 'vision-australia',
    year: 2004,
    refs: [{
      url: 'https://www.visionaustralia.org/about-us/who-we-are/history',
      label: '"In 2004 Vision Australia became Australia\'s first national blindness agency. Vision Australia was formed following the merger of the Royal Blind Society (RBS), the Royal Victorian Institute for the Blind (RVIB), Vision Australia Foundation (VAF), and the National Information Library Services (NILS) in July 2004."; ' + CHECKED3,
    }],
  },
  {
    slug: 'skynet-technologies',
    year: 2002,
    refs: [{
      url: 'https://www.skynettechnologies.com/about-us',
      label: 'Stat-плитка на странице About Us: "2002" с подписью "Founded in" сразу под числом; ' + CHECKED3,
    }],
  },
  {
    slug: 'sierra7',
    year: 2009,
    refs: [{ url: 'https://sierra7.com/our-leadership/', label: 'Leadership bio: "...has been a Sierra7 partner since its founding in 2009"; ' + CHECKED3 }],
  },
  {
    slug: 'jim-byrne-associates',
    year: 2003,
    refs: [{
      url: 'https://jimbyrne.co.uk/about-jim-byrne-associates-accessible-website-design/',
      label: 'Заявление от первого лица: "In 2003, I started my own business to provide accessibility auditing and accessible website design services to a wider group of organisations."; ' + CHECKED3,
    }],
  },
  {
    slug: 'web-usability',
    year: 2001,
    refs: [{
      url: 'https://web.archive.org/web/20260101053403/https://www.webusability.co.uk/about-us/',
      label:
        '"Web Usability is a strategic user experience consultancy, established in 2001." — живой сайт был за anti-bot (sgcaptcha), подтверждено через архивную копию Wayback того же URL; пересматривает CLEAR из D-047 ("год не опубликован нигде на сайте" — тогда сайт тоже был недоступен); ' +
        CHECKED3,
    }],
  },
  {
    slug: 'tetralogical',
    year: 2019,
    refs: [{ url: 'https://tetralogical.com/about/', label: '"We formed TetraLogical in 2019 because we saw the market become more driven by legal compliance than meeting the needs of different people."; ' + CHECKED3 }],
  },
  {
    slug: 'alpanet',
    year: 2000,
    refs: [{
      url: 'https://alpanet.pl/o-nas',
      label: 'Таймлайн истории, заголовок "Powstanie firmy ALPANET": "2000 Powstanie firmy ALPANET Firma ALPANET rozpoczęła swoją działalność, stawiając na innowacje i nowoczesne technologie."; ' + CHECKED3,
    }],
  },
  {
    slug: 'vobacom',
    year: 1999,
    refs: [{
      url: 'https://vobacom.pl/o-firmie',
      label:
        'Таймлайн "Historia": "1999 Początkowo firma działa jako spółka cywilna BMPG (Business Media Professional Group)..." (в 2006 преобразована в sp. z o.o. и переименована в VOBACOM — смена формы, не основание; взята более ранняя дата старта деятельности); ' +
        CHECKED3,
    }],
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
