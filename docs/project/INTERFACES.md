# INTERFACES

## Снапшот (существует)
data/manifests/<YYYY-MM-DD>.json:
{ date, fetchedAt, sources: [{ id, datasetId, name, url, rowsUpdatedAt,
  rawBytes, gzBytes, lines, sha256, seconds } | { ..., error }] }
Raw: release-ассеты fmcsa-<date>/{census,authority-history,
authority-current,sms-census}.csv.gz

## События дельта-движка (контракт для реализации, TBD до ревью)
{ date, dot_number, type: new_authority | authority_revoked |
  authority_reinstated | insurance_lapse | insurance_filed |
  address_change | name_change | phone_change | fleet_change,
  before, after }
Хранение: append-only таблица events в D1 + месячные NDJSON в R2.

## D1 (эскиз, TBD до ревью схемы)
carriers_current: dot PRIMARY KEY, legal_name, dba, city, state,
  status, operation, power_units, mcs150_date, prior_revoke, phone,
  mc_numbers, updated_at
events: см. выше. Индексы по (state,city), (type,date), phone.
