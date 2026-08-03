import type { UIStrings } from '@/lib/types'
import stays from '@data/stays.json'
import type { StaysData } from '@data/types'

// Медиана и разброс длительности содержания по учреждению — честный факт из
// прошлых данных (Deportation Data Project), не прогноз. Показываем только там,
// где данных достаточно (см. minN в скрипте). Числа агрегатные, персональных
// данных нет.
const BY = (stays as StaysData).byCode

export function FacilityStay({ code, ui }: { code: string; ui: UIStrings }) {
  const s = BY[code]
  if (!s) return null
  const v = ui.visitFinder
  const line = v.stayLine
    .replace('{med}', String(s.med))
    .replace('{p25}', String(s.p25))
    .replace('{p75}', String(s.p75))
    .replace('{n}', s.n.toLocaleString('en-US'))
  return (
    <div className="vf-stay">
      <div className="vf-stay-t">{v.stayTitle}</div>
      <p className="vf-stay-line">{line}</p>
      <p className="hint">{v.stayNote}</p>
    </div>
  )
}
