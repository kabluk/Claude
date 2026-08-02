import type { UIStrings } from '@/lib/types'

// Визуальная «карта документа»: схема уведомления о явке (NTA / I-862)
// с подписями, где искать A-Number, дату слушания, суд и чью подпись.
// Помогает тем, кто плохо читает. Это схема, а не копия формы —
// никакие данные не вводятся и никуда не уходят.
export function DocMap({ ui }: { ui: UIStrings }) {
  const d = ui.docMap
  return (
    <figure className="docmap" role="group" aria-label={d.title}>
      <figcaption className="dm-cap">{d.title}</figcaption>
      <div className="dm-sheet">
        <div className="dm-row dm-top">
          <span className="dm-form">{d.formLabel}</span>
          <span className="dm-anum">
            <b>A-123 456 789</b>
            <em>{d.anum}</em>
          </span>
        </div>
        <div className="dm-zone">
          <span className="dm-tag">{d.charges}</span>
          <div className="dm-lines">
            <i></i>
            <i></i>
            <i></i>
          </div>
        </div>
        <div className="dm-zone dm-hl">
          <span className="dm-tag">{d.hearing}</span>
          <div className="dm-kv">
            <b>00/00/0000 · 00:00</b>
          </div>
        </div>
        <div className="dm-zone">
          <span className="dm-tag">{d.court}</span>
          <div className="dm-lines">
            <i></i>
          </div>
        </div>
        <div className="dm-row dm-sign">
          <span className="dm-tag">{d.signature}</span>
          <span className="dm-scribble">✎</span>
        </div>
      </div>
      <p className="dm-note">{d.note}</p>
    </figure>
  )
}
