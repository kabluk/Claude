// Логика опроса: порядок, видимость, варианты, правила → задачи.
// Перенесено из docs/detnav-intake.html как есть. Текст — в content/intake/.
// Персональные данные никуда не отправляются: состояние живёт в памяти вкладки.

export type Ans = Record<string, string | undefined>

const S = (a: Ans) => a.role === 'self'

export interface QDef {
  id: string
  block: number
  when?: (a: Ans) => boolean
  opts: (a: Ans) => string[]
}

export const QUESTIONS: QDef[] = [
  { id: 'role', block: 0, opts: () => ['self', 'other'] },
  {
    id: 'state',
    block: 0,
    opts: (a) => (S(a) ? ['nothing', 'case', 'before'] : ['nothing', 'just', 'found', 'court']),
  },
  { id: 'anum', block: 1, opts: () => ['yes', 'find', 'no', 'what'] },
  { id: 'idb', block: 1, when: (a) => !S(a), opts: () => ['all', 'part', 'no'] },
  { id: 'years', block: 2, opts: () => ['lt1', '1_5', '5_10', 'gt10', 'dunno'] },
  {
    id: 'home',
    block: 2,
    opts: (a) => (S(a) ? ['me', 'other', 'none', 'dunno'] : ['him', 'me', 'both', 'none', 'dunno']),
  },
  { id: 'usfam', block: 2, opts: () => ['close', 'other', 'no', 'dunno'] },
  { id: 'work', block: 2, opts: () => ['official', 'cash', 'own', 'none', 'dunno'] },
  { id: 'courts', block: 2, opts: () => ['came', 'missed', 'never', 'dunno'] },
  { id: 'sponsor', block: 3, opts: () => ['yes', 'maybe', 'no', 'dunno'] },
  { id: 'kids', block: 4, opts: () => ['yes', 'no', 'dunno'] },
  { id: 'school', block: 4, when: (a) => a.kids === 'yes', opts: () => ['yes', 'only', 'dunno'] },
  {
    id: 'guard',
    block: 4,
    when: (a) => a.kids === 'yes',
    opts: () => ['status', 'nostatus', 'no', 'dunno'],
  },
  { id: 'dep', block: 4, opts: () => ['yes', 'no', 'dunno'] },
  { id: 'meds', block: 5, opts: () => ['yes', 'no', 'dunno'] },
  { id: 'hipaa', block: 5, opts: () => ['yes', 'no', 'dunno'] },
  { id: 'sole', block: 6, opts: () => ['yes', 'no', 'dunno'] },
  { id: 'pay', block: 6, opts: () => ['yes', 'no', 'dunno'] },
  { id: 'trusted', block: 6, when: (a) => S(a), opts: () => ['yes', 'maybe', 'no', 'dunno'] },
  { id: 'phones', block: 6, opts: () => ['yes', 'no'] },
  { id: 'docs', block: 7, opts: () => ['have', 'know', 'no', 'dunno'] },
  { id: 'crim', block: 7, opts: () => ['never', 'docs', 'nodocs', 'dunno'] },
  { id: 'copies', block: 7, opts: () => ['yes', 'no', 'dunno'] },
]

export type Priority = 'now' | 'soon' | 'later'
export interface TaskRef {
  p: Priority
  k: string
  rk: string
}

export function rules(a: Ans): TaskRef[] {
  const T: TaskRef[] = []
  const add = (p: Priority, k: string, rk: string) => T.push({ p, k, rk })
  const urgent = a.state === 'just' || a.state === 'found' || a.state === 'court'

  if (a.anum === 'yes') add('now', 'anum_have', 'anum_have')
  if (a.anum === 'find' || a.anum === 'what') add('now', 'anum_find', 'anum_find_docs')
  if (a.anum === 'no') add('now', urgent ? 'anum_ask' : 'anum_find', 'anum_none')
  if (a.idb === 'part' || a.idb === 'no') add('now', 'idb', 'idb')

  if (urgent) {
    add('now', 'nosign', 'urgent')
    add('now', 'verify', 'urgent')
    add('now', 'connect', 'urgent')
    add('soon', 'money', 'money')
  }
  add(urgent ? 'now' : 'soon', 'freehelp', 'freehelp')
  if (urgent && a.role === 'other') add('later', 'support', 'support')

  if (a.trusted === 'yes') add('soon', 'trusted_setup', 'trusted_yes')
  if (a.trusted === 'maybe' || a.trusted === 'dunno') add('now', 'trusted_setup', 'trusted_maybe')
  if (a.trusted === 'no') add('now', 'trusted_find', 'trusted_no')
  if (a.state === 'case' || a.state === 'court') add('now', 'court_dates', 'case_open')
  if (a.state === 'before') add('soon', 'prior_case', 'prior')

  if (a.home === 'him' || a.home === 'me' || a.home === 'both' || a.home === 'other')
    add('soon', 'ev_home', 'home_has')
  if (a.home === 'none') add('soon', 'ev_home', 'home_none')
  if (a.years && a.years !== 'dunno') add('soon', 'ev_years', 'years')
  if (a.usfam === 'close' || a.usfam === 'other') add('soon', 'ev_family', 'family')
  add('soon', 'community', 'community')
  add('soon', 'support_letters', 'support_letters')
  if (a.work === 'official') add('soon', 'ev_work_off', 'work_off')
  if (a.work === 'cash') add('soon', 'ev_work_cash', 'work_cash')
  if (a.work === 'own') add('soon', 'ev_work_own', 'work_own')
  if (a.courts === 'came' || a.courts === 'missed') add('soon', 'ev_courts', 'courts')
  if (a.crim === 'docs' || a.crim === 'nodocs') add('now', 'ev_crim', 'crim')

  // Задача про залог осмысленна, только когда человек уже задержан:
  // в режиме подготовки нет ни адвоката, ни учреждения — вместо неё
  // задача выбрать адвоката заранее (фидбек первого пользователя).
  if (urgent) add('now', 'bond_first', 'bond_first')
  else add('now', 'lawyer_ready', 'lawyer_ready')
  if (a.sponsor === 'yes') add('soon', 'sponsor_ready', 'sponsor_yes')
  if (a.sponsor === 'maybe' || a.sponsor === 'dunno') add('now', 'sponsor_talk', 'sponsor_maybe')
  if (a.sponsor === 'no') add('now', 'bondfund', 'sponsor_no')

  if (a.school === 'only' || a.school === 'dunno') add('now', 'school_add', 'school_only')
  if (a.guard === 'status') add('soon', 'caregiver', 'guard_status')
  if (a.guard === 'nostatus' || a.guard === 'no') add('now', 'caregiver_risk', 'guard_risk')
  if (a.dep === 'yes') add('soon', 'dep_plan', 'dep')

  if (a.meds === 'yes') add('now', 'meds_list', 'meds')
  if (a.meds === 'yes' && a.hipaa !== 'yes') add('soon', 'hipaa', 'hipaa')

  if (a.sole === 'yes') add('soon', 'poa', 'sole')
  if (a.pay === 'yes') add('now', 'payments', 'pay')
  if (a.phones !== 'yes') add('now', 'phones', 'phones')

  if (a.docs === 'have' || a.docs === 'know') add('soon', 'docs_gather', 'docs_has')
  if (a.docs === 'no' || a.docs === 'dunno') add('soon', 'docs_gather', 'docs_none')
  if (a.copies !== 'yes') add('soon', 'copies_trusted', 'copies')

  const o: Record<Priority, number> = { now: 0, soon: 1, later: 2 }
  return T.filter((t, i, s) => s.findIndex((x) => x.k === t.k) === i).sort(
    (x, y) => o[x.p] - o[y.p],
  )
}

export function visibleQuestions(a: Ans): QDef[] {
  return QUESTIONS.filter((q) => !q.when || q.when(a))
}
