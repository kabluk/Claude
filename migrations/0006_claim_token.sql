-- Слой 2 (Lead Marketplace) — добавляет отдельную secret verify-токен-колонку
-- к claims (0004_claims.sql). См. docs/project/DECISIONS.md D-023 и
-- docs/project/GRAPH.yaml узел A2-CLAIM-API для обоснования: `id` — публичный
-- claimId, возвращается вызывающему сразу в ответе POST /api/claim (INTERFACES.md
-- §2 контракт "{claimId}"); `token` — отдельный секрет, НЕ возвращается в ответе,
-- пишется в D1 здесь и будет вставлен в verify-link, отправляемый только на email
-- (A2-CLAIM-EMAIL). Если бы token совпадал с id/claimId, любой вызывающий получал
-- бы "доказательство владения email" немедленно из самого ответа API, без
-- реального перехода по ссылке — это ломает саму цель email-верификации.
-- patch_json (0004_claims.sql) намеренно не переиспользован под token — тот
-- столбец зарезервирован под предложенные правки профиля агентства, применяемые
-- ежедневным D1-оверлеем (A2-CLAIM-REBUILD), смешивать формат было бы риском.
ALTER TABLE claims ADD COLUMN token TEXT;

CREATE INDEX IF NOT EXISTS idx_claims_token ON claims (token);
