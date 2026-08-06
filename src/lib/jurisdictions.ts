// Список юрисдикций для селектора на /scan (D-032).
//
// ⚠ ЗЕРКАЛО worker/lib/jurisdiction.js::supportedJurisdictions(). Воркер — plain
// ESM JS без общего с фронтендом модуля (D-010), импортировать его отсюда нельзя,
// поэтому список продублирован. Чтобы копия не разъехалась молча, есть тест
// src/lib/jurisdictions.test.mjs — он читает РЕАЛЬНЫЙ worker-модуль и сверяет
// коды стран с этим файлом (тот же приём, что isValidScanUrl ↔ isHttpUrl в
// scanner.ts, но там синхронность держится вручную — здесь проверяется).
//
// Названия стран — для человека в выпадающем списке; воркер их не использует,
// он знает только двухбуквенный код.

export type JurisdictionOption = { code: string; label: string }

export const JURISDICTION_OPTIONS: JurisdictionOption[] = [
  { code: 'AT', label: 'Austria' },
  { code: 'BE', label: 'Belgium' },
  { code: 'DK', label: 'Denmark' },
  { code: 'FI', label: 'Finland' },
  { code: 'FR', label: 'France' },
  { code: 'DE', label: 'Germany' },
  { code: 'IE', label: 'Ireland' },
  { code: 'IT', label: 'Italy' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'NO', label: 'Norway' },
  { code: 'PL', label: 'Poland' },
  { code: 'ES', label: 'Spain' },
  { code: 'SE', label: 'Sweden' },
]
