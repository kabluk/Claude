-- Слой 3 (A3-CRON, «мониторинг как подписка») — таблица подписчиков на
-- периодический перескан URL. См. docs/project/DECISIONS.md D-135 и узел
-- A3-CRON-SCHEMA в docs/project/GRAPH.yaml.
--
-- Подписчик здесь — не аккаунт: пара (email, url) без пароля и без сессии
-- (D-135 п.1), поэтому единственное доказательство того, что за адресом стоит
-- живой человек, — переход по verify-ссылке из письма. Отсюда двухколоночный
-- паттерн, скопированный с claims (0004_claims.sql + 0006_claim_token.sql,
-- D-023), а не изобретённый заново:
--   * `id`    — ПУБЛИЧНЫЙ идентификатор подписки. Его и только его возвращает
--               POST /api/subscribe в теле ответа; он же попадает в логи и в
--               ответы служебных эндпоинтов.
--   * `token` — СЕКРЕТ verify-ссылки. Пишется здесь, читается только по
--               точному совпадению при GET-верификации и уходит наружу
--               исключительно внутри письма на подтверждаемый адрес.
--
-- Инвариант для будущего узла A3-CRON-SUBSCRIBE-API (реализуется отдельно):
-- ответ API обязан содержать `id` и НИКОГДА не содержать `token` — ни в теле,
-- ни в заголовке, ни в редиректе. Если token вернуть синхронно, вызывающий
-- получает «доказательство владения email» из самого ответа и подтверждает
-- чужой адрес не открывая почту, то есть double opt-in перестаёт существовать
-- как защита. По той же причине token генерируется независимо от id, а не
-- выводится из него хэшем/префиксом.
--
-- status: pending (создана, письмо не подтверждено)
--       | active  (подтверждена, попадает в cron-выборку)
--       | unsubscribed (отписана, в выборку не попадает, строка сохраняется
--         ради истории и защиты от повторной подписки-спама)
-- verified — факт перехода по ссылке; отдельно от status, как в claims:
-- status может уехать в unsubscribed, но верификация адреса остаётся фактом.
--
-- last_scan_id — логическая ссылка на scans.id БЕЗ FOREIGN KEY, ровно как
-- leads.scan_id (0003_leads.sql): сканы удаляются по TTL (deleteExpiredScans),
-- и внешний ключ либо ронял бы удаление, либо каскадом сносил подписку.
-- NULL до первого перескана. cadence на MVP всегда 'weekly' — колонка заведена
-- сразу, чтобы daily/monthly не требовали второй миграции по живой таблице.
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  url TEXT NOT NULL,
  token TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  last_scan_id TEXT,
  cadence TEXT NOT NULL DEFAULT 'weekly',
  created_at TEXT NOT NULL,
  unsubscribed_at TEXT
);

-- verify-lookup: единственный способ найти строку по секрету из письма.
CREATE INDEX IF NOT EXISTS idx_subscriptions_token ON subscriptions (token);
-- cron-выборка активных подписок (A3-CRON-RESCAN-DELTA).
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);
-- дедупликация «этот же сайт уже под наблюдением» и будущий поиск по адресу.
CREATE INDEX IF NOT EXISTS idx_subscriptions_url ON subscriptions (url);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions (email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON subscriptions (created_at);
