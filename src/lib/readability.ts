// G-TOOL-READABILITY (Sonnet, узел-магнит второго инструмента): чистая
// математика читаемости для страницы-инструмента /tools/readability-checker/.
// Ноль зависимостей, ноль DOM — только строки и числа, поэтому модуль
// тестируется в Node напрямую (src/lib/readability.test.mjs) и одинаково
// работает при SSG-пререндере (без window) и в браузере — та же дисциплина,
// что у src/lib/contrast.ts (шаблон этого узла).
//
// Формулы — общепринятые опубликованные версии (коэффициенты как в Flesch
// 1948 / Kincaid et al. 1975 / Gunning 1952 / McLaughlin (SMOG) 1969 /
// Coleman & Liau 1975 / Automated Readability Index (Senter & Smith 1967));
// та же таблица коэффициентов, что цитируется в Wikipedia «Flesch–Kincaid
// readability tests», «Gunning fog index», «SMOG», «Coleman–Liau index»,
// «Automated readability index» — общепризнанные эталонные источники,
// совпадающие между собой и с большинством публичных калькуляторов.
// ВСЕ формулы англоязычные (счёт слогов и веса калиброваны под английский) —
// честно сказано на самой странице, не только здесь.

// --- Токенизация: слова, предложения, слоги. Эвристики без словаря —
// как и весь модуль, они пререндерятся и работают офлайн, но НЕ идеальны
// (см. комментарий у countSyllablesInWord ниже).

// Слово — последовательность латинских букв, с необязательным внутренним
// апострофом (don't, can't). Числа и прочие символы словами не считаются —
// упрощение, common для читаемых-метрик; отмечено в комментарии к
// analyzeReadability и на самой странице (см. ReadabilityCheckerPage).
const WORD_RE = /[A-Za-z]+(?:['’][A-Za-z]+)?/g

export function tokenizeWords(text: string): string[] {
  return text.match(WORD_RE) ?? []
}

// Предложения — эвристика на терминальной пунктуации (.!?), с фолбэком на
// «хвост без точки» (текст без финального знака препинания не должен давать
// 0 предложений и делить на ноль ниже). Не различает Mr./Dr. и десятичные
// точки от настоящих концов предложения — тот же компромисс, что у
// большинства онлайн-калькуляторов читаемости (документировано на странице).
const SENTENCE_RE = /[^.!?]+[.!?]+|[^.!?]+$/g

export function splitSentences(text: string): string[] {
  const matches = text.match(SENTENCE_RE) ?? []
  return matches.map((s) => s.trim()).filter((s) => /[A-Za-z0-9]/.test(s))
}

// Счётчик слогов — эвристика по группам гласных (a,e,i,o,u,y), с поправкой
// на немую конечную «e» (cake → cak → 1 группа), но НЕ на «e» после «l»
// (simple, table, cycle) — там «e» после «l» звучит как отдельный слог
// (syllabic l), и эта поправка её защищает от вырезания. Без словаря
// произношения (CMUdict и т.п.) это неизбежно ЭВРИСТИКА: известное
// ограничение — слова с нестандартным произношением (напр. «queue» — реально
// 1 слог, здесь посчитает иначе) или заимствования считаются неточно.
// Слова длиной ≤3 буквы считаются за 1 слог без анализа (cat, the, dog…).
export function countSyllablesInWord(rawWord: string): number {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '')
  if (!word) return 0
  if (word.length <= 3) return 1
  let w = word.replace(/[^laeiouy](?:es|ed|e)$/, '')
  w = w.replace(/^y/, '')
  // Каждая МАКСИМАЛЬНАЯ последовательность гласных — один слоговый ядер-звук
  // (напр. «eau» в beautiful — одна группа, а не две): без «+» (было {1,2})
  // трёхбуквенное «eau» резалось бы на «ea»+«u» и давало лишний слог.
  const groups = w.match(/[aeiouy]+/g)
  return groups ? Math.max(1, groups.length) : 1
}

export function countSyllables(words: string[]): number {
  return words.reduce((sum, w) => sum + countSyllablesInWord(w), 0)
}

// «Сложное» слово для индекса Ганнинга — упрощённое определение, буквально
// «≥3 слога», как и просит спецификация узла. Полная методика Ганнинга
// исключает имена собственные, привычный жаргон и словоформы с суффиксами
// -ed/-es/-ing — этого автоматически без словаря не определить надёжно,
// поэтому здесь сознательно упрощённая версия (как у большинства онлайн
// Fog-калькуляторов); ограничение честно названо на самой странице.
export function isComplexWord(word: string): boolean {
  return countSyllablesInWord(word) >= 3
}

export interface TextStats {
  sentences: number
  words: number
  syllables: number
  complexWords: number
  letters: number
}

const EMPTY_STATS: TextStats = { sentences: 0, words: 0, syllables: 0, complexWords: 0, letters: 0 }

// Гвард против пустого/пробельного ввода: 0 слов → нулевая статистика, а не
// NaN/деление на ноль где-либо ниже. Вызывающий код (виджет) показывает это
// как явное состояние «введите текст», а не сломанные цифры.
export function textStats(text: string): TextStats {
  const words = tokenizeWords(text)
  if (words.length === 0) return { ...EMPTY_STATS }
  const sentences = Math.max(1, splitSentences(text).length)
  const syllables = countSyllables(words)
  const complexWords = words.filter(isComplexWord).length
  const letters = words.reduce((sum, w) => sum + w.replace(/[^A-Za-z]/g, '').length, 0)
  return { sentences, words: words.length, syllables, complexWords, letters }
}

export interface ReadabilityScores {
  fleschReadingEase: number | null
  fleschKincaidGrade: number | null
  gunningFog: number | null
  smogIndex: number | null
  colemanLiauIndex: number | null
  automatedReadabilityIndex: number | null
}

const NULL_SCORES: ReadabilityScores = {
  fleschReadingEase: null,
  fleschKincaidGrade: null,
  gunningFog: null,
  smogIndex: null,
  colemanLiauIndex: null,
  automatedReadabilityIndex: null,
}

// --- Формулы. Каждая берёт уже посчитанную textStats — коэффициенты
// дословно из опубликованных определений (см. шапку файла).

// Flesch Reading Ease (Flesch, 1948). 0–100, выше = легче читать.
export function fleschReadingEase(s: TextStats): number | null {
  if (s.words === 0) return null
  const asl = s.words / s.sentences // average sentence length
  const asw = s.syllables / s.words // average syllables per word
  return 206.835 - 1.015 * asl - 84.6 * asw
}

// Flesch–Kincaid Grade Level (Kincaid et al., 1975). Класс школы США.
export function fleschKincaidGrade(s: TextStats): number | null {
  if (s.words === 0) return null
  const asl = s.words / s.sentences
  const asw = s.syllables / s.words
  return 0.39 * asl + 11.8 * asw - 15.59
}

// Gunning Fog Index (Gunning, 1952). Годы образования, нужные для
// понимания с первого раза.
export function gunningFog(s: TextStats): number | null {
  if (s.words === 0) return null
  const asl = s.words / s.sentences
  const complexShare = s.complexWords / s.words
  return 0.4 * (asl + 100 * complexShare)
}

// SMOG Index (McLaughlin, 1969). Валидна как оценка для текстов из ≥30
// предложений (исходная методика мерила ровно 30) — для более коротких
// текстов число всё равно возвращается (гейт на «финитность», не на длину
// текста), но менее надёжно; это честно сказано на самой странице.
export function smogIndex(s: TextStats): number | null {
  if (s.words === 0) return null
  return 1.043 * Math.sqrt(s.complexWords * (30 / s.sentences)) + 3.1291
}

// Coleman–Liau Index (Coleman & Liau, 1975). Единственная формула здесь,
// которая не использует слоги вовсе — только буквы и предложения на 100 слов.
export function colemanLiauIndex(s: TextStats): number | null {
  if (s.words === 0) return null
  const L = (s.letters / s.words) * 100 // среднее число букв на 100 слов
  const S = (s.sentences / s.words) * 100 // среднее число предложений на 100 слов
  return 0.0588 * L - 0.296 * S - 15.8
}

// Automated Readability Index (Senter & Smith, 1967).
export function automatedReadabilityIndex(s: TextStats): number | null {
  if (s.words === 0) return null
  const charsPerWord = s.letters / s.words
  const wordsPerSentence = s.words / s.sentences
  return 4.71 * charsPerWord + 0.5 * wordsPerSentence - 21.43
}

export function readabilityScores(s: TextStats): ReadabilityScores {
  if (s.words === 0) return { ...NULL_SCORES }
  return {
    fleschReadingEase: fleschReadingEase(s),
    fleschKincaidGrade: fleschKincaidGrade(s),
    gunningFog: gunningFog(s),
    smogIndex: smogIndex(s),
    colemanLiauIndex: colemanLiauIndex(s),
    automatedReadabilityIndex: automatedReadabilityIndex(s),
  }
}

// --- Flesch Reading Ease → band на человеческом языке + примерный класс
// школы США. Таблица — общепринятая (Flesch/Farr, воспроизведена в
// Wikipedia «Flesch–Kincaid readability tests» и большинстве калькуляторов
// читаемости); границы включительно снизу, описания — простым языком,
// не жаргоном «Flesch score» — читатель этой страницы может не знать
// формул вовсе.
export interface FleschBand {
  label: string
  description: string
  approxGrade: string
}

const FLESCH_BANDS: { min: number; label: string; description: string; approxGrade: string }[] = [
  { min: 90, label: 'very easy', description: 'Very easy to read. Understood by an average 11-year-old.', approxGrade: '5th grade' },
  { min: 80, label: 'easy', description: 'Easy to read. Conversational English for consumers.', approxGrade: '6th grade' },
  { min: 70, label: 'fairly easy', description: 'Fairly easy to read.', approxGrade: '7th grade' },
  { min: 60, label: 'plain English', description: 'Plain English. Easily understood by 13- to 15-year-olds.', approxGrade: '8th–9th grade' },
  { min: 50, label: 'fairly difficult', description: 'Fairly difficult to read.', approxGrade: '10th–12th grade' },
  { min: 30, label: 'difficult', description: 'Difficult to read.', approxGrade: 'college' },
  { min: 10, label: 'very difficult', description: 'Very difficult to read. Best understood by university graduates.', approxGrade: 'college graduate' },
  { min: -Infinity, label: 'extremely difficult', description: 'Extremely difficult to read. Best understood by specialists.', approxGrade: 'post-graduate' },
]

export function fleschBand(score: number): FleschBand {
  const band = FLESCH_BANDS.find((b) => score >= b.min) ?? FLESCH_BANDS[FLESCH_BANDS.length - 1]
  return { label: band.label, description: band.description, approxGrade: band.approxGrade }
}

// --- Округление для показа (2 знака для Flesch score, 1 знак для
// grade-индексов — как в большинстве публичных калькуляторов). Сырые
// значения остаются доступны в scores.* для тестов.
export const round1 = (n: number): number => Math.round(n * 10) / 10
export const round2 = (n: number): number => Math.round(n * 100) / 100

export interface ReadabilityResult {
  hasText: boolean
  stats: TextStats
  scores: ReadabilityScores
  band: FleschBand | null
}

// Единая точка входа для виджета: строка → всё, что нужно показать.
// Пустой/пробельный ввод — явное состояние «нет текста», не NaN и не крэш.
export function analyzeReadability(text: string): ReadabilityResult {
  const stats = textStats(text)
  if (stats.words === 0) {
    return { hasText: false, stats, scores: { ...NULL_SCORES }, band: null }
  }
  const scores = readabilityScores(stats)
  const band = scores.fleschReadingEase !== null ? fleschBand(scores.fleschReadingEase) : null
  return { hasText: true, stats, scores, band }
}
