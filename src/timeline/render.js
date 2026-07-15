// Render computed milestones into localized, FACTUAL strings using the
// `t.milestones` i18n subtree. Pure — used by the Cabinet timeline card and the
// notify dry-run. Copy is never composed here; only interpolated from i18n.

const fmt = (str, vars = {}) => String(str || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))

// renderMilestones(t, milestones) → [{ key, dueDate, forms, title, body, line }]
export function renderMilestones(t, milestones = []) {
  const m = t.milestones
  return milestones.map((ms) => {
    const item = m.items[ms.key] || { title: ms.key, body: '' }
    const forms = (ms.forms || []).join(', ')
    const body = fmt(item.body, { date: ms.dueDate, forms })
    return {
      key: ms.key,
      dueDate: ms.dueDate,
      forms: ms.forms || [],
      title: item.title,
      body,
      line: fmt(m.reminder, { title: item.title, body }),
    }
  })
}
