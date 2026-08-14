import type { UIStrings } from '@/lib/types'
import stays from '@data/stays.json'
import type { StaysData } from '@data/types'

// Национальный контекст из detention stays (Deportation Data Project):
// медиана длительности + доля выдворений. Только агрегатные числа, честно,
// без ложной надежды и без продвижения залога/parole.
// tsc выводит вложенные массивы JSON как (string | number)[][], а не как
// кортеж [string, number][] — каст через unknown, данные в рантайме верны.
const META = (stays as unknown as StaysData).meta

export function NationalStats({ ui }: { ui: UIStrings }) {
  const removed = META.leave.find(([k]) => k === 'Removed')?.[1]
  const n = ui.national
  return (
    <div className="natstat">
      <div className="natstat-t">{n.title}</div>
      <p className="natstat-big">
        {n.median.replace('{days}', String(META.nationalMedian))}
      </p>
      {removed !== undefined && <p className="natstat-p">{n.removal.replace('{pct}', String(removed))}</p>}
      <p className="hint">{n.note}</p>
    </div>
  )
}
