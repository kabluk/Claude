-- Классификация ошибки скана для фронтенда (worker/lib/errors.js, D-013).
-- error остаётся сырым текстом для отладки; error_code — маленький enum для UI.
ALTER TABLE scans ADD COLUMN error_code TEXT;
