#!/usr/bin/env node
// G-FOUNDED (D-047): проставляет `founded` ТОЛЬКО там, где агентство само
// опубликовало год возникновения своей организации, и кладёт рядом источник —
// URL страницы + ДОСЛОВНУЮ цитату с годом в label.
//
// Разовый скрипт-патч по образцу scripts/apply-priceband.mjs (D-045).
// Правило отбора и полный журнал отклонений — docs/project/DECISIONS.md (D-047)
// и docs/project/domains/data.md. Ничего не выдумывает: каждая запись ниже —
// результат ручной проверки страницы (см. `quote`), а не оценки «на глаз».
//
// Что считается годом основания (кратко; развёрнуто — D-047):
//   A. Собственный сайт, явная формулировка основания, подлежащее — организация:
//      «gegründet/Gründung», «was founded/established», «créée/fondée en»,
//      «powstała/istnieje od … roku», «opgericht», «fundada en», «perustettiin»,
//      «is in … gestart», «inception», «we began in».
//   D. Собственный сайт даёт год в формулировке о деятельности («seit/since/
//      depuis/od … roku») И РОВНО ТОТ ЖЕ год стоит в поле «Основана» профиля
//      компании в LinkedIn, на который ссылается сам сайт агентства. Две
//      независимые публикации самой компании, совпадающие в годе, снимают
//      двусмысленность «с какого года» (см. D-047, замер расхождений).
// Не считается: год регистрации домена, копирайт в футере, год начала
// специализации/партнёрства, год основания материнской компании или клиента,
// LinkedIn в одиночку.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const FILE = join(ROOT, 'data/a11y/agencies.json')
const CHECKED = 'checked 2026-08-06'

// --- A: явная формулировка основания на собственном сайте агентства ---------
const UPDATES = [
  {
    slug: 'deque-systems',
    year: 1999,
    refs: [
      {
        url: 'https://www.deque.com/company/',
        label: 'company FAQ: "When was Deque founded? CEO and Founder Preety Kumar started Deque in 1999."; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'level-access',
    year: 1999,
    refs: [
      {
        url: 'https://www.levelaccess.com/company/',
        label: 'Our story: "Level Access was founded in 1999 by engineers with disabilities"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'digital-accessibility-centre',
    year: 2010,
    refs: [
      {
        url: 'https://digitalaccessibilitycentre.org/about.html',
        label:
          'Our Organisation: "The Digital Accessibility Centre was founded in 2010 and established as a social enterprise operating on a not-for-profit basis."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'mile-high-accessibility',
    year: 2019,
    refs: [
      {
        url: 'https://www.milehighaccessibility.com/about-1',
        label:
          'Our Story: "Mile High Accessibility Consultants (MHAC) was founded in 2019, by key personnel from a well-known ADA consulting firm"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'access42',
    year: 2014,
    refs: [
      {
        url: 'https://access42.net/scop/historique/',
        label:
          'historique: "La création d\'Access42, en septembre 2014, tire son origine dans l\'appel d\'offres du SGMAP pour la mise à jour du RGAA."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'dmk-ebusiness',
    year: 2008,
    refs: [
      {
        url: 'https://dmk-ebusiness.de/',
        label: 'Kennzahlen der Agentur: "2 Standorte · 34 Mitarbeitende · Gründung 2008"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'dias',
    year: 1994,
    refs: [
      {
        url: 'https://www.dias.de/ueber-dias.html',
        label:
          'Über DIAS: "Die DIAS GmbH – kurz für: Daten, Informationssysteme und Analysen im Sozialen – wurde 1994 von Rehabilitationsforschern der Universität Hamburg gegründet."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'materna',
    year: 1980,
    refs: [
      {
        url: 'https://www.materna.de/DE/Unternehmen/unternehmen_node.html',
        label: 'Unternehmen / Key Facts: "Die Materna-Gruppe wurde 1980 gegründet." ("Gründung: 1980"); ' + CHECKED,
      },
    ],
  },
  {
    slug: 'sozialhelden',
    year: 2004,
    refs: [
      {
        url: 'https://sozialhelden.de/',
        label:
          'Startseite: "Seit Raúl Krauthausen 2004 die Sozialheld*innen mit seinen Mitstreiter*innen gegründet hat, haben wir schon viel erreicht."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'bsvh',
    year: 1909,
    refs: [
      {
        url: 'https://www.bsvh.org/geschichte.html',
        label:
          'Geschichte: "Am 4. Januar 1909, dem 100. Geburtstag von Louis Braille, trafen sich einige blinde Männer, um den „Verein der Blinden von Hamburg und Umgegend“ zu gründen."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'microassist',
    year: 1988,
    refs: [
      {
        url: 'https://www.microassist.com/about/',
        label:
          'About: "Founded in 1988, Microassist helps companies and organizations improve their most valuable resources: their employees."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'qualitylogic',
    year: 1986,
    refs: [
      {
        url: 'https://www.qualitylogic.com/our-company/who-we-are/',
        label:
          'Who We Are: "QualityLogic was founded in 1986 to help solve compatibility problems between print systems and software applications."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'tamman',
    year: 2007,
    refs: [
      {
        url: 'https://tammaninc.com/about/',
        label:
          'About: "Founded in 2007, our portfolio ranges from small and medium-sized businesses to enterprise web applications"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'continual-engine',
    year: 2017,
    refs: [
      {
        url: 'https://www.continualengine.com/about-us/',
        label:
          'About: "Since our inception in 2017, we have come a long way" + таймлайн "2017 Continual Engine inception"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'apex-covantage',
    year: 1988,
    refs: [
      {
        url: 'https://apexcovantage.com/about',
        label: 'Our Journey (таймлайн): "1988 Apex Data Services Founded"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'wcag-nl',
    year: 2016,
    refs: [
      {
        url: 'https://wcag.nl/',
        label:
          'Over ons: "WCAG.nl is in 2016 gestart met het delen van kennis op het gebied van digitale toegankelijkheid."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'stichting-accessibility',
    year: 1999,
    refs: [
      {
        url: 'https://accessibility.nl/',
        label:
          'jubileumbericht: "Wat in 1999 begon als een initiatief om Nederland digitaal toegankelijk te maken, is uitgegroeid tot een organisatie die impact maakt"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'open-doors-organization',
    year: 2000,
    refs: [
      {
        url: 'https://opendoorsnfp.org/our-mission-history/',
        label:
          'Our Mission & History: "Open Doors Organization (ODO), a 501(c)(3) non-profit organization based in Chicago, Illinois, was founded in 2000"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'abilitynet',
    year: 1998,
    refs: [
      {
        url: 'https://abilitynet.org.uk/about',
        label:
          'About AbilityNet: "Founded by IBM and Microsoft in 1998, AbilityNet is a global leader in digital inclusion and digital accessibility"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'mixd',
    year: 2004,
    refs: [
      {
        url: 'https://www.mixd.co.uk/about/',
        label:
          'Who we are: "Founded in 2004, we are a multidisciplinary team of designers, engineers and delivery experts"; ' +
          CHECKED,
      },
    ],
  },
  {
    // было 1998 (без источника). Собственная страница «About» агентства
    // называет 1999; "since 1998" на главной — про опыт в отрасли, не про
    // основание. Правило A: явная формулировка перевешивает (D-047).
    slug: 'knowbility',
    year: 1999,
    refs: [
      {
        url: 'https://knowbility.org/about',
        label:
          'Our Story: "It was founded in 1999 as the result of a two year community collaboration to raise awareness and improve skills around digital accessibility"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'urbilog',
    year: 1995,
    refs: [
      {
        url: 'https://urbilog.com/a-propos',
        label:
          'Qui sommes-nous : "Urbilog a été créée en 1995 à l\'initiative de précurseurs en accessibilité numérique"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'crawford-technologies',
    year: 1995,
    refs: [
      {
        url: 'https://crawfordtech.com/about-us/',
        label:
          'About us: "Founded in 1995 by Ernie Crawford, Crawford Technologies has grown and expanded since then"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'intopia',
    year: 2016,
    refs: [
      {
        url: 'https://intopia.digital/about-us/',
        label: 'About us: "Intopia was founded in 2016, by Adem Cifcioglu, Sarah Pulis, and Stewart Hay."; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'accessibil-it',
    year: 2009,
    refs: [
      {
        url: 'https://accessibilit.com/about-us/',
        label: 'About Us: "Founded in 2009, Accessibil-IT is recognized as global accessible PDF specialists."; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'eye-square',
    year: 1999,
    refs: [
      {
        url: 'https://www.eye-square.com/en/company/',
        label: 'Company / Quick facts: "Established 1999 in Berlin, Germany"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'metadrop',
    year: 2011,
    refs: [
      {
        url: 'https://metadrop.net/',
        label:
          'portada: "Fundada en 2011, Metadrop se ha consolidado como un referente en la comunidad Drupal."; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'usability-ie',
    year: 2026,
    refs: [
      {
        url: 'https://usability.ie/about.html',
        label: 'About: "Sister practice to digitaldesign.ie · Established 2026"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'digital-strategy-ie',
    year: 2012,
    refs: [
      {
        url: 'https://digitalstrategy.ie/about/',
        label:
          'About: "Digital Strategy Consultants, founded in 2012, is a digital marketing agency and consultancy based in Dublin"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'hilfsgemeinschaft',
    year: 1935,
    refs: [
      {
        url: 'https://hilfsgemeinschaft.at/die-hilfsgemeinschaft/geschichte',
        label:
          'Geschichte: "Die Hilfsgemeinschaft der Blinden und Sehschwachen Österreichs wurde 1935 gegründet und feiert heuer ihr 90-jähriges Jubiläum!"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'zoonou',
    year: 2007,
    refs: [
      {
        url: 'https://zoonou.com/company/',
        label: 'Company: "Established in 2007 by Nick and Jonathan, we\'re now a 50+ strong team"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'access-by-design',
    year: 2006,
    refs: [
      {
        url: 'https://accessbydesign.uk/about/our-history/',
        label: 'Our History: "Access by Design was founded by Clive Loseby in 2006."; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'ascentiq-solutions',
    year: 2012,
    refs: [
      {
        url: 'https://ascentiqsolutions.co.uk/about-us/',
        label: 'About Us: "AscentiQ Solutions is a UK based IT company, established in 2012"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'silktide',
    year: 2001,
    refs: [
      {
        url: 'https://silktide.com/company/',
        label:
          'Company: "Founded in 2001, Silktide helps thousands of customers analyze tens of millions of web pages every year."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'equal-entry',
    year: 2012,
    refs: [
      {
        url: 'https://equalentry.com/about/',
        label: 'Our History: "Equal Entry was founded in 2012 by accessibility expert Thomas Logan."; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'testpros',
    year: 1988,
    refs: [
      {
        url: 'https://testpros.com/about/',
        label:
          'About TestPros: "Established in 1988, TestPros provides independent IT assessment and security assurance services."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'die-medialen',
    year: 2003,
    refs: [
      {
        url: 'https://diemedialen.de/internetagentur/die-medialen-geschichte',
        label:
          'Die Medialen Geschichte: "Entdecken Sie die besonderen Momente der Medialen von unserer Gründung im Jahr 2003 bis heute."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'stiftung-pfennigparade',
    year: 1952,
    refs: [
      {
        url: 'https://www.pfennigparade.de/ueber-uns/geschichte/',
        label:
          'Geschichte: "Die Pfennigparade wird 1952 gegründet und widmet sich zunächst der Bekämpfung der seit Kriegsende andauernden Polioepidemie."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'clickstorm',
    year: 2002,
    refs: [
      {
        url: 'https://clickstorm.de/agentur/',
        label: 'Agentur: "2002 in Leipzig gegründet und mit einem Händchen für die Entwirrung der härtesten Knoten"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'ceciaa',
    year: 1990,
    refs: [
      {
        url: 'https://www.ceciaa.com/qui-sommes-nous',
        label:
          'Qui sommes-nous : "CECIAA a été créée en 1990 par des personnes aveugles dont Jean-Luc AUGAUDY, aujourd\'hui Président de la Société."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'numerik-ea',
    year: 2016,
    refs: [
      {
        url: 'https://numerik-ea.fr/',
        label:
          'accueil : "Créée en 2016, numerik-ea est la première entreprise adaptée (EA) – agence web spécialisée dans l\'accessibilité numérique"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'temesis',
    year: 2000,
    refs: [
      {
        url: 'https://temesis.com/a-propos/',
        label:
          'À propos : "Créée en 2000, Temesis est une agence de conseil en numérique responsable, spécialisée en accessibilité numérique"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'extranet-joanna-pazdzierska',
    year: 2002,
    refs: [
      {
        url: 'https://extranet.pl/4,o-nas',
        label: 'O nas: "Firma Extranet istnieje od 2002 roku."; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'utilitia',
    year: 2008,
    refs: [
      {
        url: 'https://utilitia.pl/o-nas/',
        label: 'O nas: "Nasza firma powstała w grudniu 2008 roku."; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'tollwerk',
    year: 2000,
    refs: [
      {
        url: 'https://tollwerk.de/tollwerk/team',
        label:
          'Team: "Im Jahr 2000 hat Joschi das Tollwerk gegründet, 2020 dann die Transformation zur kollegial-selbstorganisierten Organisation angestoßen."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'path-ie',
    year: 2006,
    refs: [
      {
        url: 'https://path.ie/about/',
        label: 'Our Story: "We began in 2006 as a web design studio."; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'eficode',
    year: 2005,
    refs: [
      {
        url: 'https://eficode.com/our-approach',
        label: 'Who we are: "We started in Finland in 2005 with a simple conviction"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'virtualmedia',
    year: 2003,
    refs: [
      {
        url: 'https://www.virtualmedia.pl/o-nas',
        label:
          'O nas: "VIRTUALMEDIA działa w Olsztynie nieprzerwanie od 2003 roku, tworząc profesjonalne rozwiązania z zakresu stron internetowych"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'fundacja-instytut-rozwoju-regionalnego',
    year: 2003,
    refs: [
      {
        url: 'https://firr.org.pl/o-nas/',
        label:
          'O nas: "Fundacja Instytut Rozwoju Regionalnego jest organizacją pożytku publicznego, działającą od 2003 r., z siedzibą w Krakowie"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'grupa-af',
    year: 2011,
    refs: [
      {
        url: 'https://grupaaf.pl/about/',
        label: 'O nas: "10-letnie doświadczenie w branży (na rynku od 2011 roku)"; ' + CHECKED,
      },
    ],
  },

  // --- D: год «с … года» на своём сайте + тот же год в поле «Основана»
  //        LinkedIn-профиля, на который ссылается сам сайт агентства ---------
  {
    slug: 'insert-effect',
    year: 2002,
    refs: [
      { url: 'https://inserteffect.com/', label: 'Startseite: "Seit 2002 entwickeln wir Web und Apps"; ' + CHECKED },
      {
        url: 'https://www.linkedin.com/company/inserteffect/',
        label: 'LinkedIn-Unternehmensprofil (со своего сайта): "Gegründet 2002"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'damteq',
    year: 2006,
    refs: [
      {
        url: 'https://damteq.co.uk/about/',
        label: 'About: "We’re a people-first Growth Agency that has been growing businesses since 2006."; ' + CHECKED,
      },
      {
        url: 'https://www.linkedin.com/company/damteq/',
        label: 'LinkedIn company profile (linked from the site): "Founded 2006"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'cyber-duck',
    year: 2005,
    refs: [
      {
        url: 'https://cyber-duck.co.uk/our-culture',
        label:
          'Our story: "Since 2005 our pioneering people and process has seen CACI Digital Experience grow, explore and showcase ground-breaking work"; ' +
          CHECKED,
      },
      {
        url: 'https://www.linkedin.com/company/cyber-duck/',
        label:
          'LinkedIn company profile (linked from the site): "Established in 2005, CACI Digital Experience (formerly Cyber-Duck)" / "Founded 2005"; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'ten10',
    year: 2008,
    refs: [
      { url: 'https://ten10.com/about/', label: 'About: "SINCE 2008 · 3,500+ projects delivered"; ' + CHECKED },
      {
        url: 'https://www.linkedin.com/company/ten10-group/',
        label: 'LinkedIn company profile (linked from the site): "Founded 2008"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'webaim',
    year: 1999,
    refs: [
      {
        url: 'https://webaim.org/about',
        label:
          'About WebAIM: "WebAIM (Web Accessibility In Mind) has provided comprehensive web accessibility solutions since 1999."; ' +
          CHECKED,
      },
      {
        url: 'https://www.linkedin.com/company/webaim/',
        label: 'LinkedIn company profile (linked from the site): "Founded 1999"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'bureau-of-internet-accessibility',
    year: 2001,
    refs: [
      {
        url: 'https://www.boia.org/about',
        label:
          'About: "The Bureau of Internet Accessibility (BoIA) has been helping eliminate the digital divide since 2001."; ' +
          CHECKED,
      },
      {
        url: 'https://www.linkedin.com/company/bureau-of-internet-accessibility/',
        label: 'LinkedIn company profile (linked from the site): "Founded 2001"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'braille-works',
    year: 1994,
    refs: [
      {
        url: 'https://brailleworks.com/braille-transcription-company/',
        label:
          'company page: "We are cost-effective, women-owned, have HITRUST Common Security Framework v9.3.1, and consistent growth since 1994."; ' +
          CHECKED,
      },
      {
        url: 'https://www.linkedin.com/company/braille-works/',
        label: 'LinkedIn company profile (linked from the site): "Founded 1994"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'kolibri-online',
    year: 2008,
    refs: [
      {
        url: 'https://kolibri-online.com/agentur/',
        label: 'Agentur: "Wir sind Kolibri. Content-Marketing- und Lokalisierungsagentur seit 2008."; ' + CHECKED,
      },
      {
        url: 'https://www.linkedin.com/company/kolibri-online/',
        label: 'LinkedIn-Unternehmensprofil (со своего сайта): "Gegründet 2008"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'accessprod',
    year: 2018,
    refs: [
      { url: 'https://accessprod.com/', label: 'accueil : "À vos côtés depuis 2018"; ' + CHECKED },
      {
        url: 'https://www.linkedin.com/company/accessprod/',
        label: 'profil LinkedIn (lié depuis le site) : "Fondée en 2018"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'atalan',
    year: 2002,
    refs: [
      {
        url: 'https://atalan.fr/',
        label:
          'accueil : "Spécialisés dans l\'accessibilité numérique depuis 2002, nous intervenons en tant qu\'expert indépendant dans vos projets."; ' +
          CHECKED,
      },
      {
        url: 'https://www.linkedin.com/company/atalan_2',
        label: 'profil LinkedIn (lié depuis le site) : "Fondée en 2002"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'com-access',
    year: 2013,
    refs: [
      {
        url: 'https://com-access.fr/qui-sommes-nous/',
        label:
          'Qui sommes-nous : "Depuis 2013, pour répondre à nos valeurs, nous avons réuni nos expertises pour proposer accompagnement, conseil et formation"; ' +
          CHECKED,
      },
      {
        url: 'https://www.linkedin.com/company/com-access/',
        label: 'profil LinkedIn (lié depuis le site) : "Fondée en 2013"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'ipedis',
    year: 2006,
    refs: [
      {
        url: 'https://ipedis.com/',
        label:
          'accueil : "un web inclusif et accessible à tous, y compris les personnes en situation de handicap, c\'est le challenge d\'IPEDIS depuis 2006"; ' +
          CHECKED,
      },
      {
        url: 'https://www.linkedin.com/company/ipedis/',
        label: 'profil LinkedIn (lié depuis le site) : "Fondée en 2006"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'licorn-publishing',
    year: 2006,
    refs: [
      {
        url: 'https://licornpublishing.com/',
        label:
          'accueil : "Depuis 2006, notre agence accompagne les entreprises en quête d\'une identité forte et développe leurs projets digitaux."; ' +
          CHECKED,
      },
      {
        url: 'https://www.linkedin.com/company/licorn-publishing/',
        label: 'profil LinkedIn (lié depuis le site) : "Fondée en 2006"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'axes4',
    year: 2015,
    refs: [
      {
        url: 'https://axes4.com/de/ueber-uns/kurz-vorgestellt',
        label: 'Kurz vorgestellt: "Seit 2015 machen wir die Welt für alle Menschen besser, weil zugänglicher"; ' + CHECKED,
      },
      {
        url: 'https://www.linkedin.com/company/axes4/',
        label: 'LinkedIn-Unternehmensprofil (со своего сайта): "Gegründet 2015"; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'copsae',
    year: 2021,
    refs: [
      {
        url: 'https://copsae.fr/a-propos/',
        label:
          'À propos : "Copsae … est l\'activité professionnelle de Julie Moynat depuis 2021 au sein de la Coopérative d\'Activité et d\'Emploi, l\'Ouvre-Boîtes à Nantes."; ' +
          CHECKED,
      },
      {
        url: 'https://www.linkedin.com/company/copsae/',
        label: 'profil LinkedIn (lié depuis le site) : "Fondée en 2021"; ' + CHECKED,
      },
    ],
  },

  // --- G-FOUNDED-LI (D-051): пробный пакет 20 из 180 записей без founded, ---
  //     проверенных глубже, чем первый проход D-047 (Impressum/торговый
  //     реестр/страница истории, не только homepage+About+sitemap) ----------
  {
    slug: 'siteimprove',
    year: 2003,
    refs: [
      {
        url: 'https://www.siteimprove.com/about-us/',
        label:
          'About Us: "Morten Ebbesen is the founder of Siteimprove ... He founded Siteimprove in 2003 and led the company as CEO for 18 years, growing it from a startup into a global SaaS leader."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'swink',
    year: 2007,
    refs: [
      {
        url: 'https://swink.nl/en/about-us/our-story/',
        label:
          'Our Story: "Out of that wonderment, Swink was founded in 2007. Founder Paul Malschaert wondered how he could bring these untapped talents and the labor market together."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'altix',
    year: 1989,
    refs: [
      {
        url: 'https://www.altix.pl/pl/o-firmie/historia-firmy/',
        label:
          'Historia firmy: "Spółkę Altix zawiązali w maju 1989 r.: Marek Kalbarczyk — informatyk, Eryk Zieliński — ekonomista i tłumacz, dr Stanisław Jakubowski i Igor Busłowicz – informatycy."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'zeto-rzeszow',
    year: 1966,
    refs: [
      {
        url: 'https://firma.zetorzeszow.pl/historia/',
        label:
          'Historia: "1 lipca 1966 roku władze państwa polskiego powołały do życia Zakład Elektronicznej Techniki Obliczeniowej (ZETO) w Rzeszowie."; ' +
          CHECKED,
      },
    ],
  },
  {
    slug: 'sensus',
    year: 1987,
    refs: [
      {
        url: 'https://sensus.dk/om-sensus/',
        label: 'Om Sensus: "Virksomheden blev etableret i 1987 og har siden arbejdet med rådgivning og udvikling."; ' + CHECKED,
      },
    ],
  },
  {
    slug: 'boscop',
    year: 1993,
    refs: [
      {
        url: 'https://boscop.fr/notre-scop/',
        label:
          'Notre SCOP : "Créée à Paris fin 1993, l\'entreprise, alors appelée V-Technologies, a planté ses racines en Anjou dès l\'année suivante."; ' +
          CHECKED,
      },
    ],
  },
]

// Значения, стоявшие до G-FOUNDED, для которых опубликованного года основания
// найти не удалось: сайт датирует только ДЕЯТЕЛЬНОСТЬ («seit/since/depuis …»)
// либо не называет год вовсе. Снимаются явно — журнал в domains/data.md.
const CLEAR = [
  'anatom5', // "Accessibility Experten seit 2003" — год специализации, агентство старше
  'bitv-consult', // "seit 2008 als selbstständiger Berater" — начало практики, не основание
  'usablenet', // год не опубликован нигде на сайте
  'usable-y-accesible', // сайт-CV, год компании не назван
  'ilikecake', // "proven track record … since 2006" — опыт, не основание
  'anysurfer', // "Sinds 2001 helpen we organisaties" — деятельность, не основание
  'nexer-digital', // "Since 2007, our team has built a reputation" — репутация, не основание
  'web-usability', // год не опубликован нигде на сайте
  'dig-inclusion', // год не опубликован нигде на сайте
]

const agencies = JSON.parse(readFileSync(FILE, 'utf8'))
const bySlug = new Map(agencies.map((a) => [a.slug, a]))
let setYear = 0
let changedYear = 0
let addedRef = 0
let updatedRef = 0

for (const u of UPDATES) {
  const a = bySlug.get(u.slug)
  if (!a) throw new Error(`unknown slug: ${u.slug}`)
  if (a.founded == null) setYear++
  else if (a.founded !== u.year) changedYear++
  a.founded = u.year
  for (const r of u.refs) {
    const existing = (a.sourceRefs || []).find((x) => x.url === r.url)
    if (existing) {
      // Источник уже был в записи и, как правило, описывает не только год
      // (адрес, услуги, штат). Прежний label не затираем — дописываем цитату
      // года: иначе перепроверка других полей теряет своё доказательство.
      const quoted = r.label.slice(r.label.indexOf('"'), r.label.lastIndexOf('"') + 1)
      if (!existing.label.includes(quoted)) {
        existing.label = `${existing.label} · founded: ${quoted} (${CHECKED})`
        updatedRef++
      }
    } else {
      a.sourceRefs.push({ url: r.url, label: r.label })
      addedRef++
    }
  }
}

let cleared = 0
for (const slug of CLEAR) {
  const a = bySlug.get(slug)
  if (!a) throw new Error(`unknown slug: ${slug}`)
  if (a.founded != null) {
    delete a.founded
    cleared++
  }
}

// Порядок ключей: `founded` живёт сразу после `website` (как в types.ts).
// Присваивание новому ключу иначе дописывает его в конец объекта, и файл-
// источник истины, который читают и правят руками, становится разнородным.
const ordered = agencies.map((a) => {
  if (a.founded == null) return a
  const { founded, ...rest } = a
  const out = {}
  for (const [k, v] of Object.entries(rest)) {
    out[k] = v
    if (k === 'website') out.founded = founded
  }
  if (out.founded === undefined) out.founded = founded
  return out
})

writeFileSync(FILE, JSON.stringify(ordered, null, 2) + '\n')
const withYear = agencies.filter((a) => a.founded)
console.log(
  `founded: ${withYear.length}/${agencies.length} записей ` +
    `(проставлено ${setYear}, исправлено ${changedYear}, снято ${cleared}, ` +
    `источников добавлено ${addedRef}, уточнено ${updatedRef})`,
)
const byCc = {}
for (const a of withYear) byCc[a.hq.countryCode] = (byCc[a.hq.countryCode] || 0) + 1
console.log(
  '  по странам: ' +
    Object.entries(byCc)
      .sort((x, y) => y[1] - x[1])
      .map(([c, n]) => `${c} ${n}`)
      .join(', '),
)
