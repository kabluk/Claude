// Источники FMCSA/DOT для ежедневных снапшотов.
// Все — официальная программа открытых данных DOT (data.transportation.gov),
// редистрибуция разрешена. Юридический разбор: docs/moat-analysis.html §"юридика".
export const SOCRATA_HOST = 'https://data.transportation.gov';

export const SOURCES = [
  {
    id: 'census',
    datasetId: 'az4n-8mr2',
    name: 'Company Census File',
    kind: 'rows', // табличный датасет → полный CSV-экспорт
    note: '147 колонок: контакты, офицеры, парк, prior_revoke_flag. Обновляется ~ежедневно.',
  },
  {
    id: 'authority-history',
    datasetId: 'u4i8-4m26',
    name: 'Carrier - All With History (L&I)',
    kind: 'blob', // файловый датасет → прямое скачивание
    note: 'История authority/страховых требований по всем перевозчикам/брокерам/экспедиторам.',
  },
  {
    id: 'authority-current',
    datasetId: '6eyk-hxee',
    name: 'Carrier - All With History (табличная)',
    kind: 'rows',
    note: '43 колонки статусов authority (common/contract/broker, pending/revoked).',
  },
  {
    id: 'sms-census',
    datasetId: 'kjg3-diqy',
    name: 'SMS Input - Motor Carrier Census Information',
    kind: 'rows',
    note: 'Месячный CSA-прогон: активные interstate + intrastate hazmat перевозчики.',
  },
];

export function exportUrl(src) {
  return src.kind === 'blob'
    ? `${SOCRATA_HOST}/download/${src.datasetId}/text%2Fplain`
    : `${SOCRATA_HOST}/api/views/${src.datasetId}/rows.csv?accessType=DOWNLOAD`;
}

export function metaUrl(src) {
  return `${SOCRATA_HOST}/api/views/${src.datasetId}.json`;
}
