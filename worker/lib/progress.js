// CN-SCAN-PHASES (D-067): фазы скана и репортер прогресса.
//
// Фазы — ровно те, которые scanSite() РЕАЛЬНО проходит (worker/lib/axe.js),
// не выдуманная гранулярность:
//   discovering  — загрузка главной, выбор до MAX_PAGES страниц (A3-PAGESELECT)
//   statement    — заявление о доступности + канал обратной связи (A3-STATEMENT/FEEDBACK)
//   axe          — axe-core на текущей странице обхода
//   dom-checks   — браузерные проверки той же страницы (reflow/resize/media/headings/keyboard)
//   aggregating  — site-level проверки, взвешивание юрисдикции, подсчёт score
// axe и dom-checks чередуются по страницам — pagesDone/pagesTotal говорят, где
// обход находится; финальный completeScan/failScan стирает прогресс (db.js).

export const SCAN_PHASES = ['discovering', 'statement', 'axe', 'dom-checks', 'aggregating']

import { updateScanProgress } from './db.js'

// Репортер: (phase, pagesDone, pagesTotal) -> Promise<void>.
// Неизвестная фаза — ошибка программиста, падает сразу (не пишем мусор в D1).
// Ошибка ЗАПИСИ прогресса намеренно проглатывается: прогресс — best-effort
// телеметрия, из-за неё скан падать не должен (восстановление ≠ повтор:
// деградация до «прогресс не виден» безопасна и честна, UI имеет fallback).
export function makeProgressReporter(db, id) {
  return async (phase, pagesDone, pagesTotal) => {
    if (!SCAN_PHASES.includes(phase)) throw new Error(`unknown scan phase: ${phase}`)
    try {
      await updateScanProgress(db, { id, phase, pagesDone, pagesTotal })
    } catch {
      // best-effort: скан важнее телеметрии
    }
  }
}
