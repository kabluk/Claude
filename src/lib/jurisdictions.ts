// Список юрисдикций для селектора на /scan (D-032).
//
// ⚠ ЗЕРКАЛО worker/lib/jurisdiction.js::supportedJurisdictions(). Воркер — plain
// ESM JS без общего с фронтендом модуля (D-010), импортировать его отсюда нельзя,
// поэтому список продублирован. Чтобы копия не разъехалась молча, есть тест
// src/lib/jurisdictions.test.mjs — он читает РЕАЛЬНЫЙ worker-модуль и сверяет
// коды стран, названия законов и флаг verified с этим файлом (тот же приём, что
// isValidScanUrl ↔ isHttpUrl в scanner.ts, но там синхронность держится вручную —
// здесь проверяется).
//
// Названия стран — для человека в выпадающем списке; воркер их не использует,
// он знает только двухбуквенный код.
//
// D-143 (карточка «What's at risk»): к зеркалу добавлены `law` и `verified` —
// строго те же значения, что в воркере, никаких «своих» формулировок закона.
// `law` — короткое имя национального акта, `verified` — сверена ли ссылка с
// первоисточником И относится ли к ЧАСТНОМУ сектору (сегодня только DE; см.
// шапку worker/lib/jurisdiction.js и D-034). Сумм штрафов здесь нет и быть не
// может (D-035).

export type JurisdictionOption = {
  code: string
  label: string
  law: string
  verified: boolean
  // Является ли основание транспозицией EAA (Directive (EU) 2019/882) — только
  // для таких стран честно говорить «применяется с 28 июня 2025». Норвегия не
  // член ЕС: через соглашение ЕЭЗ действуют эквивалентные правила, но её
  // forskrift 2013 года старше EAA, и приписывать ей срок EAA нельзя (тот же
  // разбор, что в комментарии к NO в воркере).
  eaa: boolean
}

export const JURISDICTION_OPTIONS: JurisdictionOption[] = [
  { code: 'AT', label: 'Austria', law: 'BaFG', verified: false, eaa: true },
  { code: 'BE', label: 'Belgium', law: 'Loi du 5.11.2023 (2023046827)', verified: false, eaa: true },
  { code: 'DK', label: 'Denmark', law: 'LOV nr 801 af 07/06/2022', verified: false, eaa: true },
  { code: 'FI', label: 'Finland', law: 'Laki 306/2019 + asetus 179/2023', verified: false, eaa: true },
  { code: 'FR', label: 'France', law: 'RGAA', verified: false, eaa: true },
  { code: 'DE', label: 'Germany', law: 'BFSG', verified: true, eaa: true },
  { code: 'IE', label: 'Ireland', law: 'S.I. No. 636/2023', verified: false, eaa: true },
  { code: 'IT', label: 'Italy', law: 'EAA transposition (D.Lgs. 82/2022)', verified: false, eaa: true },
  {
    code: 'NL',
    label: 'Netherlands',
    law: 'Tijdelijk besluit digitale toegankelijkheid overheid',
    verified: false,
    eaa: true,
  },
  {
    code: 'NO',
    label: 'Norway',
    law: 'Forskrift om universell utforming av IKT-løsninger',
    verified: false,
    eaa: false,
  },
  { code: 'PL', label: 'Poland', law: 'Ustawa o dostępności cyfrowej', verified: false, eaa: true },
  { code: 'ES', label: 'Spain', law: 'RD 1112/2018', verified: false, eaa: true },
  { code: 'SE', label: 'Sweden', law: 'Lag (2023:254)', verified: false, eaa: true },
]

// Одна точка входа «код страны → наша юрисдикция». Возвращает undefined для
// всего, чего в списке нет (US, GB, мусор, undefined) — именно на этом держится
// правило честности карточки «What's at risk»: не знаем страну или она вне
// наших 13 — правовую плашку не рисуем вовсе.
export function jurisdictionByCode(code: string | null | undefined): JurisdictionOption | undefined {
  if (typeof code !== 'string') return undefined
  const upper = code.trim().toUpperCase()
  return JURISDICTION_OPTIONS.find((j) => j.code === upper)
}
