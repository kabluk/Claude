// G-CHECKER-INTERLINK (D-179, 2026-08-15): единый реестр бесплатных чекеров.
//
// Раньше этот список жил захардкоженным ВНУТРИ ToolsIndexPage.tsx, и потому
// был доступен только индексу — сами страницы чекеров о существовании друг
// друга не знали. Аудит (D-179) нашёл ровно ту же структуру «звезда», что
// была у гайдов (D-176), только хуже: 5 из 6 чекеров ссылались на контраст-
// чекер, а он сам — ни на один другой; между собой (кроме связи с контрастом)
// чекеры не были связаны вовсе. Вынос в общий модуль — то, что делает блок
// «Other checkers» на каждой странице возможным без дублирования списка.
//
// Тексты (title/dek) — те же, что были в ToolsIndexPage, перенесены дословно.
// Логика связей — checkerRelations.ts (отдельный файл, см. его шапку).

import { paths } from './data'
import { relatedCheckersFor, type CheckerEntry } from './checkerRelations'

export type { CheckerEntry, CheckerTopic } from './checkerRelations'

export const CHECKERS: CheckerEntry[] = [
  {
    href: paths.contrastChecker(),
    title: 'Colour contrast checker',
    dek: 'Enter two colours and get a live WCAG 2.2 AA/AAA pass or fail for normal text, large text and UI — hex, RGB or HSL.',
    topic: 'colour',
  },
  {
    href: paths.readabilityChecker(),
    title: 'Readability checker',
    dek: 'Paste your text and see six readability formulas — Flesch, Flesch-Kincaid, Gunning Fog, SMOG, Coleman-Liau and ARI — update live, in plain language.',
    topic: 'text',
  },
  {
    href: paths.colorBlindnessSimulator(),
    title: 'Colour blindness simulator',
    dek: 'Upload an image, or use the built-in sample, and see it approximated for protanopia, deuteranopia and tritanopia side by side.',
    topic: 'colour',
  },
  {
    href: paths.colorConverter(),
    title: 'Colour converter',
    dek: 'Enter a colour in hex, rgb() or hsl() and get all three notations at once, with contrast ratios against black and white.',
    topic: 'colour',
  },
  {
    href: paths.textToSpeech(),
    title: 'Text-to-speech reader',
    dek: 'Paste text and hear it read aloud with your browser’s own voices — adjustable rate and pitch, nothing sent anywhere.',
    topic: 'text',
  },
  {
    href: paths.colorPaletteGenerator(),
    title: 'Colour palette generator',
    dek: 'Generate complementary, triadic and other harmonious palettes — every swatch shows its readable text colour, WCAG contrast ratio and AA pass/fail.',
    topic: 'colour',
  },
  {
    href: paths.statementGenerator(),
    title: 'Accessibility statement generator',
    dek: 'Fill in a short form and copy a ready accessibility statement — plain text or HTML, built on the W3C WAI structure, with EU “compliant” wording where it applies.',
    // topic 'markup' — не «работа с текстом» и не «цвет»: это инструменты по
    // разбору/составлению разметки и документов, отдельная семья от colour
    // (D-181/D-183). Без своей темы они вытеснялись бы цветовой четвёркой из
    // выдачи друг у друга.
    topic: 'markup',
  },
  {
    href: paths.altTextChecker(),
    title: 'Alt text checker',
    dek: 'Paste your HTML and check every image for missing, empty, redundant or file-name alt text against WCAG 1.1.1 — entirely in your browser.',
    topic: 'markup',
  },
  {
    href: paths.headingChecker(),
    title: 'Heading structure checker',
    dek: 'Paste your HTML and see the heading outline plus structural problems — missing or multiple h1, skipped levels, empty headings.',
    topic: 'markup',
  },
]

export const relatedCheckers = (currentHref: string, limit = 3): CheckerEntry[] =>
  relatedCheckersFor(CHECKERS, currentHref, limit)
