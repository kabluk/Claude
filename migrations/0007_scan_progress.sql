-- CN-SCAN-PHASES (D-067): пофазный прогресс скана. Воркер пишет промежуточные
-- UPDATE по ходу скана (worker/lib/db.js::updateScanProgress); финальные
-- completeScan/failScan перезаписывают поле в NULL — у завершённого скана
-- прогресса нет по определению. Старые строки (NULL) читаются как «прогресса
-- нет» — обратная совместимость с записями до этой миграции и с ещё не
-- задеплоенным воркером (UI обязан работать с обоими, D-064 fallback).
-- Формат JSON: {"phase":"discovering|statement|axe|dom-checks|aggregating",
--               "pagesDone":N,"pagesTotal":N|null,"updatedAt":ISO}
ALTER TABLE scans ADD COLUMN progress_json TEXT;
