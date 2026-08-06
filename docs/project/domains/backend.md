# Домен: backend

Обновлено: 2026-08-05 · Владелец: backend-engineer

## A1-SCAN — реализован, статус review (D-010)

Файлы: `worker/index.js` (роутер + CORS), `worker/routes/scan.js` (POST/GET),
`worker/lib/{db,ratelimit,turnstile,axe,score,links}.js`, `wrangler.jsonc`,
`migrations/0001_init.sql`. Plain ESM JS, без TypeScript-тулчейна (D-010) —
`tsconfig.json` его не трогает (`include` ограничен `src`).

- **D1** (`scans`): вставка pending → `ctx.waitUntil` фоновая работа → complete/fail.
  Локально проверено: `wrangler d1 migrations apply accessatlas-scans --local`,
  затем реальные HTTP-запросы через `wrangler dev` — 404 на несуществующий id,
  400 на невалидный URL, 202+scanId на валидный, статус `error` с сообщением при
  падении фоновой работы. Полный round-trip write→read подтверждён живьём.
- **KV rate-limit**: fixed-window, 5/час на IP + 10/час на целевой домен
  (`worker/lib/ratelimit.js`). Не покрыт live-тестом в этой сессии (нужно ≥5
  запросов подряд к одному IP), но логика идентична уже проверенному коду
  (`kv.get`/`kv.put` — тот же паттерн, что и в D1-хелперах).
- **Turnstile**: `worker/lib/turnstile.js`, пропускается если `TURNSTILE_SECRET_KEY`
  не задан (дев-режим без секрета не падает) — секрет добавляется через
  `wrangler secret put TURNSTILE_SECRET_KEY`, никогда не в `wrangler.jsonc`.
- **Сканер** (`worker/lib/axe.js`): `@cloudflare/puppeteer`, до 6 страниц (главная +
  до 5 ссылок того же origin, `worker/lib/links.js` — чистая функция, 4 юнит-теста),
  таймаут навигации 15с, честный User-Agent со ссылкой на /about. axe-core 4.10.2
  инжектится как content-script (`addScriptTag({content})`, не `src=CDN` — иначе
  CSP на чужом сайте блокирует), источник кэшируется в edge Cache API на 7 дней.
- **Score** (`worker/lib/score.js`): дедуп по `ruleId` (худшая severity инстанса),
  не по числу нод — 5 юнит-тестов, все проходят.
- Тесты: `npm run worker:test` → `node --test worker/**/*.test.mjs` (31/31 зелёных).
  ⚠ `node --test worker` (без glob) на этой версии Node находит только 1 тест —
  баг discovery, не тестов; скрипт использует explicit glob, не трогать без причины.
- **errorCode** (D-013, `worker/lib/errors.js`): классификация сырой ошибки скана
  в маленький enum (`unreachable|refused|tls|timeout|blocked|internal`) паттерн-
  матчингом по тексту. `error` (сырой текст) остаётся для отладки, `errorCode` —
  то, на чём фронтенд строит понятные сообщения (VISION.md UX 4). Миграция
  `0002_error_code.sql` (аддитивная, `ALTER TABLE`, не трогает `0001_init.sql`).
  6 юнит-тестов.

## A1-EXPLAIN — реализован, статус review (D-016)

`worker/lib/explain.js` (промпт, парсинг ответа, кэш) + `worker/routes/explain.js`
(POST /api/explain) + `checkExplainRateLimit` в `worker/lib/ratelimit.js` (ядро
лимитера обобщено между scan и explain, добавлены юнит-тесты, которых раньше не
было ни у одной из этих функций — 6 тестов в `ratelimit.test.mjs`).

- **Кэш**: отдельный KV `EXPLAIN_CACHE` (не `RATE_LIMIT_KV` — разное назначение и
  TTL), ключ `explain:${ruleId}:${locale}`, TTL 30 дней. Промпт намеренно не
  получает `sampleHtml`/селектор конкретного экземпляра — иначе первый вызывающий
  «засорял» бы генерик-кэш формулировкой под свой сайт.
- **Модель**: `claude-haiku-4-5-20251001`, JSON-only ответ, парсится и валидируется
  (`parseExplainResponse` — 10 юнит-тестов). Промпт явно просит вернуть пустой
  `explanation`, если `ruleId` не узнан уверенно — сервер трактует это как «нет
  объяснения», не выдумывает.
- **Rate-limit**: 30/час на IP — почти всегда cache-hit, лимит нужен только против
  забивания кэша мусорными `ruleId` (каждый промах — оплаченный вызов).
- **Деградация без секрета**: `/api/explain` без `ANTHROPIC_API_KEY` отвечает 503,
  не падает и не пытается тайно тратить деньги — проверено вживую.

### Что НЕ подтверждено (честно, не done)

**Реальная генерация пояснения не подтверждена — нужен платный API-ключ Anthropic,
и это отдельное одобрение, не то же самое, что разрешение на платные ресурсы CF
для A1-SCAN** (правило зафиксировано заранее в HANDOFF.md/RISKS.md, D-016). Всё,
что можно было проверить без реального ключа — проверено живьём: 400/503/429/502
через `wrangler dev`, включая тест фиктивным ключом (`--var ANTHROPIC_API_KEY:...`)
— запрос реально дошёл до Anthropic и получил настоящий `401 invalid x-api-key`,
подтверждая, что сетевой путь и обработка ошибок работают. В отличие от Browser
Rendering (D-010), здесь MITM-прокси песочницы не помешал — это обычный `fetch`
внутри Worker-рантайма, не отдельно запущенный процесс со своим доверием к CA.

## Что НЕ подтверждено (честно, не done)

Реальная инъекция и выполнение `axe.run()` против живого сайта — единственный
непроверенный кусок. В этой сессии дошли до `page.goto()` (браузер реально
запустился локально после `CI=true`, снимающего `--no-sandbox`-ограничение
контейнера), но напоролись на MITM-прокси песочницы: локальный Chromium не
доверяет её CA, TLS/сертификатные ошибки на любой внешний сайт. Это ограничение
среды разработки этой сессии, не кода — у настоящего Cloudflare Browser Rendering
в проде прямой выход в интернет. **Перед тем как считать A1-SCAN done**, нужен
один прогон `wrangler dev --remote` (использует реальную инфраструктуру CF, требует
`wrangler login` с аккаунтом владельца) или прямой прод-деплой.

## Деплой (когда владелец даст добро на конкретный шаг)

```bash
npx wrangler login                                  # аккаунт владельца
npx wrangler d1 create accessatlas-scans            # → database_id в wrangler.jsonc
npx wrangler kv namespace create RATE_LIMIT_KV       # → id в wrangler.jsonc
npx wrangler kv namespace create EXPLAIN_CACHE       # → id в wrangler.jsonc
npx wrangler d1 migrations apply accessatlas-scans --remote
npx wrangler secret put TURNSTILE_SECRET_KEY         # опционально для dev
npx wrangler secret put ANTHROPIC_API_KEY            # нужен явный OK владельца, см. D-016
npx wrangler deploy
```

`ALLOWED_ORIGIN` в `wrangler.jsonc` дублирует ORIGIN из `src/lib/seo.tsx` —
обновить вместе при покупке домена (A0-ORIGIN), иначе CORS перекроет `/api/scan`
с прод-фронтенда.

**Turnstile — пара переменных, настраивать вместе** (D-015): `TURNSTILE_SECRET_KEY`
(секрет, `wrangler secret put`, только в Worker) и `VITE_TURNSTILE_SITE_KEY`
(публичный site key, build-переменная Cloudflare Pages, `src/components/
TurnstileWidget.tsx`). Оба симметрично опциональны в dev (виджет не рендерится /
сервер не проверяет), но в проде должны появиться синхронно — иначе либо формы
без защиты от ботов (секрет забыт), либо все сканы падают с 403 (site key забыт,
токен никогда не приходит, а сервер его требует).

## A1-EXPLAIN — закрыто (2026-08-06, done, D-020)

Live-прогон реальным `ANTHROPIC_API_KEY` (владелец дал отдельное одобрение)
вскрыл настоящий баг, не гипотетический: Claude Haiku оборачивает JSON-ответ в
markdown code fence (` ```json ... ``` `), несмотря на явную инструкцию в
промпте «ONLY a JSON object, no other text». `parseExplainResponse` падал на
`JSON.parse`, каждый cache-miss отдавал 502 вместо реального объяснения. Ни
одна из прежних синтетических фикстур это не покрывала — все были чистым JSON
без фенса, баг был невидим ревью кода и юнит-тестам до реального вызова API.

Исправлено добавлением `stripCodeFence()` перед `JSON.parse` в
`worker/lib/explain.js` — не переписывали промпт ещё строже, потому что
поведение модели не гарантировано формулировкой промпта, парсер должен быть
терпимее к нему. 5 новых фикстур в `explain.test.mjs` (фенс с `json`-тегом,
без тега, битый JSON внутри фенса) — 39/39 юнит-тестов `worker/` зелёные.

Живьём подтверждены все документированные пути через `wrangler dev --local
--var ANTHROPIC_API_KEY:...` (ключ передан только как аргумент процесса,
никогда не записывался в файл и не коммитился, `wrangler` показывает его в
логе как `(hidden)`):
- happy path: `image-alt`, `color-contrast` — реальные разумные объяснения, 200
- KV-кэш: повторный запрос того же `ruleId` — 0.025s против 3.8s на промахе
  (~150×), подтверждает, что кэш реально попадает, а не просто не падает
- abstention: заведомо не axe-core `ruleId` → модель возвращает пустой
  `explanation` по инструкции промпта → 502 с честной причиной (D-016,
  ожидаемое поведение, не баг)
- 400 на невалидный формат `ruleId`, 503 без `ANTHROPIC_API_KEY` — оба пути
  не требуют реального ключа, проверены отдельным прогоном без секрета

## A1-RETENTION — сделано (2026-08-06, review)

`worker/lib/retention.js` (`deleteExpiredScans(db, now)`) + `scheduled`-хендлер в
`worker/index.js` + Cron Trigger в `wrangler.jsonc` (`0 3 * * *`, ежедневно 03:00
UTC) — закрывает TBD выше (R6/D-019). `DELETE FROM scans WHERE created_at < cutoff`,
окно **90 дней**, строгое `<` (скан ровно на границе окна доживает ещё один
прогон). Использует уже существующий `idx_scans_created_at` — новая миграция не
нужна. 5 юнит-тестов на фейковом D1 (граница, пусто, несколько записей разом,
формула cutoff) — 36/36 юнит-тестов `worker/` зелёные, `wrangler deploy --dry-run`
бандлится чисто с новым триггером. Privacy Policy обновлена вслед за этим —
раньше честно говорила «no automatic deletion yet», теперь называет реальное окно.

**status=review, не done**: Cron Triggers реально начинают тикать только после
деплоя на аккаунт владельца — сама логика удаления протестирована независимо
(фейковый D1), но живой прогон по расписанию не подтверждён, тот же класс
ограничения, что у A1-SCAN (D-010).

## Дальше по Фазе 1

- Секреты: Resend, Stripe — только в Worker secrets, не в репо (Фаза 2).
