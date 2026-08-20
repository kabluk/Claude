// G-TOOL-READABILITY: интерактивный чекер читаемости для
// /tools/readability-checker/. Вся математика — в src/lib/readability.ts
// (чистая, оттестирована отдельно). Здесь — только UI и состояние, тот же
// шаблон, что у src/components/ContrastChecker.tsx (образец узла).
//
// Дисциплина доступности (страница ПРО доступность обязана быть образцовой):
//  - textarea связана с <label> (не placeholder-в-роли-лейбла);
//  - результат озвучивается через aria-live="polite" (SR слышит пересчёт
//    после каждой паузы в наборе, не только по клику);
//  - таблица формул — настоящая <table> со scope, не div-сетка;
//  - кнопки Clear/Load sample — обычные <button>, ≥24px мишень (padding
//    .btn-ghost совпадает с контрастным чекером);
//  - собственный chrome — ТОЛЬКО токены (BRAND_BOOK), без hex/slate.
//
// Дисциплина SSG-гидрации (пререндер без window):
//  - начальное состояние — детерминированный SAMPLE-текст, ОДИНАКОВЫЙ на
//    сервере и при первом клиентском рендере (в отличие от ContrastChecker,
//    здесь вообще нет browser-only API — ни permalink, ни eyedropper, ни
//    clipboard, — поэтому useEffect для гидрации не нужен вовсе: весь расчёт
//    чистый и детерминированный от текста в состоянии);
//  - никакого window/navigator в теле рендера.

import { useId, useMemo, useState } from 'react'
import { analyzeReadability, round1, round2 } from '@/lib/readability'

// Реалистичный образец: короткий, о простом языке — тема совпадает с
// инструментом, так что статический пререндер уже показывает живой пример
// (и есть контент для axe). Смешивает простые и более длинные слова, чтобы
// таблица результатов на дефолтной странице не была вырожденной (все 100
// или все 0).
const SAMPLE_TEXT = `Plain language helps everyone. Short sentences are easier to read than long ones. When you write for the web, choose common words instead of unfamiliar jargon. This tool shows how readable your own text is, using several well-known formulas at once. Paste your own words above to see the score change instantly, with no sign-up.`

const METRICS: {
  key: 'fleschReadingEase' | 'fleschKincaidGrade' | 'gunningFog' | 'smogIndex' | 'colemanLiauIndex' | 'automatedReadabilityIndex'
  label: string
  unit: string
  meaning: string
}[] = [
  {
    key: 'fleschReadingEase',
    label: 'Flesch Reading Ease',
    unit: '0–100 scale, higher = easier',
    meaning: 'The most widely used score. Higher numbers mean plainer, easier text.',
  },
  {
    key: 'fleschKincaidGrade',
    label: 'Flesch–Kincaid Grade Level',
    unit: 'US school grade',
    meaning: 'The US school grade a reader would need to follow this on a first read.',
  },
  {
    key: 'gunningFog',
    label: 'Gunning Fog Index',
    unit: 'years of education',
    meaning: 'Years of formal education needed to understand the text easily.',
  },
  {
    key: 'smogIndex',
    label: 'SMOG Index',
    unit: 'US school grade',
    meaning: 'Another grade-level estimate, weighted more heavily toward long words.',
  },
  {
    key: 'colemanLiauIndex',
    label: 'Coleman–Liau Index',
    unit: 'US school grade',
    meaning: 'A grade-level estimate based on letters and sentences, not syllables.',
  },
  {
    key: 'automatedReadabilityIndex',
    label: 'Automated Readability Index',
    unit: 'US school grade',
    meaning: 'A grade-level estimate based on characters per word and words per sentence.',
  },
]

function formatScore(key: (typeof METRICS)[number]['key'], value: number | null): string {
  if (value === null) return '—'
  return key === 'fleschReadingEase' ? round2(value).toFixed(2) : round1(value).toFixed(1)
}

export function ReadabilityChecker() {
  const [text, setText] = useState(SAMPLE_TEXT)
  const textareaId = useId()
  const hintId = useId()

  // Живой пересчёт при каждом изменении — без кнопки «Проверить»: чистая
  // функция, дешёвая на реальных объёмах текста для этого инструмента.
  const result = useMemo(() => analyzeReadability(text), [text])

  const summary = !result.hasText
    ? 'Type or paste some text above to see its readability scores.'
    : result.band
      ? `Flesch Reading Ease ${round2(result.scores.fleschReadingEase ?? 0).toFixed(1)} — ${result.band.label} (about ${result.band.approxGrade} reading level).`
      : ''

  return (
    <div className="panel mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      {/* Левая колонка: ввод текста + результат + таблица формул. */}
      <div className="space-y-6">
        <div>
          <label htmlFor={textareaId} className="label text-on-surface-variant">
            Your text
          </label>
          <textarea
            id={textareaId}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            aria-describedby={hintId}
            className="input-area mt-2 w-full resize-y"
            placeholder="Paste or type the text you want to check…"
          />
          <p id={hintId} className="mt-2 text-xs text-on-surface-variant">
            Scores update as you type. Nothing you paste here is sent anywhere — the whole
            calculation runs in your browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-ghost" onClick={() => setText('')}>
            <span aria-hidden="true">✕</span> Clear
          </button>
          <button type="button" className="btn-ghost" onClick={() => setText(SAMPLE_TEXT)}>
            <span aria-hidden="true">↻</span> Load sample text
          </button>
        </div>

        {/* Главный результат экрана (диагноз E) — один живой регион, SR
            слышит пересчёт целиком. */}
        <div className="result-hero" aria-live="polite">
          <p className="label text-on-surface-variant">At a glance</p>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-center sm:text-left">
            <div>
              <dt className="text-xs text-on-surface-variant">Words</dt>
              <dd className="num text-3xl font-semibold text-on-surface sm:text-4xl">{result.stats.words}</dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface-variant">Sentences</dt>
              <dd className="num text-3xl font-semibold text-on-surface sm:text-4xl">{result.stats.sentences}</dd>
            </div>
            <div>
              <dt className="text-xs text-on-surface-variant">Syllables</dt>
              <dd className="num text-3xl font-semibold text-on-surface sm:text-4xl">{result.stats.syllables}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-on-surface-variant">{summary}</p>
        </div>

        {/* Таблица шести формул. Настоящая <table>, scope, никакого div-грида. */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Readability scores for the text above, one row per formula
            </caption>
            <thead>
              <tr className="border-b border-outline-variant text-left">
                <th scope="col" className="py-2 pr-3 font-medium text-on-surface">
                  Formula
                </th>
                <th scope="col" className="py-2 px-3 font-medium text-on-surface">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => (
                <tr key={m.key} className="border-b border-outline-variant/60 align-top">
                  <th scope="row" className="py-3 pr-3 font-medium text-on-surface">
                    {m.label}
                    <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">
                      {m.unit} — {m.meaning}
                    </span>
                  </th>
                  <td className="num py-3 px-3 text-base font-semibold text-on-surface">
                    {formatScore(m.key, result.scores[m.key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Правая колонка: перевод Flesch-балла в понятный язык. */}
      <div>
        <h2 className="h2 mt-0 text-lg">In plain words</h2>
        <div className="mt-3 rounded-2xl border border-outline-variant p-5">
          {result.hasText && result.band ? (
            <>
              <p className="label text-on-surface-variant">Flesch Reading Ease band</p>
              <p className="mt-1 text-2xl font-semibold capitalize text-on-surface">{result.band.label}</p>
              <p className="mt-2 text-sm text-on-surface-variant">{result.band.description}</p>
              <p className="mt-3 text-sm text-on-surface-variant">
                Roughly a <span className="text-on-surface">{result.band.approxGrade}</span> reading
                level in the US school system.
              </p>
            </>
          ) : (
            <p className="text-sm text-on-surface-variant">
              Nothing to score yet — type or paste some text, or load the sample.
            </p>
          )}
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          These formulas were built for English. They estimate reading level from sentence and word
          length — they don&rsquo;t judge tone, accuracy or whether the content is actually useful.
        </p>
      </div>
    </div>
  )
}
