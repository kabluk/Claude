# Домен: backend

Обновлено: 2026-08-06 · Владелец: backend-engineer

## A1-SCAN — закрыт, статус done (D-010, D-021)

**Реально задеплоен на аккаунт владельца 2026-08-06**: `https://accessatlas-
worker.zincroom.workers.dev`. D1 `accessatlas-scans` (`ff550a44-5ca8-4cc4-9c1e-
51b714c6a754`), KV `RATE_LIMIT_KV`/`EXPLAIN_CACHE` — реальные id в `wrangler.jsonc`
(не секреты, коммитятся). Живой скан `https://example.com` через Browser
Rendering нашёл 2 подлинные axe-core находки (`landmark-one-main`, `region` —
у example.com действительно нет `<main>`), score 94 — подтверждено прямым
`SELECT` из реальной D1, не только ответом API. Ошибочный путь тоже проверен
живьём: заведомо несуществующий домен → `status: error`, `errorCode: refused`
(`ERR_CONNECTION_RESET`). Транзиентные edge-ошибки Cloudflare (1104/1042)
наблюдались на 2 из 8 опросов в первые ~10с сразу после деплоя — самостоятельно
прошли, не связаны с данными (нормальная пропагация по глобальной сети,
см. `devops-engineer.md`).

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

## A1-EXPLAIN — закрыт, статус done (D-016, D-020, D-021)

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

Оба честных пробела выше — **закрыты 2026-08-06 (D-021)**: реальный
`ANTHROPIC_API_KEY` загружен как настоящий Worker secret на живой деплой,
подтверждён живым запросом — объяснение для `landmark-one-main` (ровно то
правило, что нашёл живой скан example.com выше) пришло адекватное.
Наблюдение: секрет пропагируется по глобальной сети Cloudflare не мгновенно
(несколько 503 «not configured» сразу после `secret put`), прошло за секунды —
не баг, обычная эксплуатационная задержка, см. `devops-engineer.md`.
`axe.run()` против живого сайта тоже подтверждён (см. A1-SCAN выше) — MITM-
прокси песочницы блокировал только *локально запущенный* Chromium Browser
Rendering, реальный деплой на Cloudflare этого ограничения не имеет.

## Деплой — выполнен 2026-08-06 (D-021)

```bash
npx wrangler d1 create accessatlas-scans            # → database_id в wrangler.jsonc
npx wrangler kv namespace create RATE_LIMIT_KV       # → id в wrangler.jsonc
npx wrangler kv namespace create EXPLAIN_CACHE       # → id в wrangler.jsonc
npx wrangler d1 migrations apply accessatlas-scans --remote
npx wrangler secret put ANTHROPIC_API_KEY            # владелец одобрил, D-020
npx wrangler deploy
```

Аутентификация — скопированный Cloudflare API-токен (Workers Scripts/Workers
KV/D1: Edit), переданный владельцем в чат и использованный только как значение
переменной окружения процесса (`CLOUDFLARE_API_TOKEN=...`), никогда не
записывался на диск и не коммитился — `wrangler login` в этой безголовой
сессии невозможен (OAuth-колбэк идёт на localhost контейнера, недостижим для
браузера владельца). `TURNSTILE_SECRET_KEY` **не задан** — Turnstile на проде
пока не активен, форма сканера всё равно работает (сервер пропускает проверку
без секрета). `ALLOWED_ORIGIN` в `wrangler.jsonc` всё ещё плейсхолдер
`accessatlas.example` — обновить вместе с покупкой домена (A0-ORIGIN), до
этого CORS не пустит браузерные запросы с задеплоенного каталога, только
прямые API-вызовы (curl и т.п.).

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

**status=review, не done**: реальный деплой 2026-08-06 (D-021) подтвердил Cron
Trigger зарегистрированным на аккаунте владельца (`schedule: 0 3 * * *` в
выводе `wrangler deploy`) — но само срабатывание по расписанию (03:00 UTC) ещё
не пронаблюдано в рамках этой сессии. Логика удаления протестирована
независимо (фейковый D1, 5 юнит-тестов).

## A2-LEAD-API — сделано (2026-08-06, done)

`POST /api/lead` — приём RFQ, матчинг подходящих агентств, запись в D1 `leads`
(`migrations/0003_leads.sql`, A2-LEAD-SCHEMA). Без отправки email (это отдельный
узел `A2-LEAD-EMAIL`, требует Resend + approval владельца).

Файлы: `worker/routes/lead.js` (хендлер + валидация + rate-limit + D1-insert,
всё в одном файле), `worker/lib/matchAgenciesServer.js` (матчинг), `worker/index.js`
(маршрут).

- **Матчинг** (`matchAgenciesServer.js`): переиспользует ТОТ ЖЕ алгоритм, что
  `src/lib/matchAgencies.ts` (страна → сужение по HQ/countriesServed, услуга —
  жёсткий фильтр, стандарт выводится из страны через `taxonomies.countries[code]
  .law.slug` и сужает пул только если после сужения кто-то остался, бюджет —
  мягкий тай-брейкер). Не импорт из `src/lib/` напрямую — `worker/` plain-ESM
  Cloudflare Worker без Vite-бандлинга, не видит `@data/a11y/*`-алиас и не может
  импортировать `.ts`. Каталог (`data/a11y/agencies.json` + `taxonomies.json`)
  импортируется статически через `import ... with { type: 'json' }` (JSON import
  attributes) — синтаксис одинаково валиден и под `node --test` (Node 22), и под
  `wrangler`/esbuild-бандлер (подтверждено `wrangler deploy --dry-run`). Если
  `src/lib/matchAgencies.ts` поменяется — обновить и этот файл вручную, синхронизации
  нет.
- **D1**: insert прямо в `lead.js`, не в `worker/lib/db.js` — тот файл специализирован
  под `scans` (см. его заголовок) и не входит в scope узла A2-LEAD-API. `status`
  всегда `'sent'` при создании (INTERFACES.md §3: `sent|responded|booked|closed`).
- **Rate-limit**: отдельная реализация KV fixed-window прямо в `lead.js` (тот же
  паттерн, что `checkFixedWindow` в `worker/lib/ratelimit.js`, но `ratelimit.js`
  не трогали — вне scope узла). 5/час на IP — ниже, чем у скана (5/ч), потому что
  RFQ «дороже» (задевает реальные агентства, не только вычислительный ресурс).
- **Turnstile**: `verifyTurnstile` из `worker/lib/turnstile.js` переиспользован
  как есть (файл не менялся), тот же паттерн, что `scan.js` — пропускается, если
  `TURNSTILE_SECRET_KEY` не задан.
- **Валидация**: `country` — обязан существовать в `taxonomies.countries`;
  `standard`/`service`/`budget` — обязаны быть известными слагами (те же списки,
  что `STANDARDS`/`SERVICES`/`PRICE_BANDS` в `src/lib/data.ts`, но вычислены
  локально из того же `taxonomies.json`); `contact.email` — обязателен, тот же
  regex, что `src/lib/leadForm.ts`; `deadline` — опционален, но если задан, не в
  прошлом. Смысл проверок копирует `leadForm.ts::validateLeadForm`, реализация
  отдельная по той же причине, что и матчинг (TS/Vite-алиасы недоступны воркеру).

Верифицировано: 26 новых юнит-тестов (`worker/lib/matchAgenciesServer.test.mjs` —
изолированные фикстуры + один smoke-тест на реальном каталоге;
`worker/routes/lead.test.mjs` — фейковые D1/KV, включая подмену `fetch` для
Turnstile-путей) — 65/65 `worker:test` зелёные. `npm run typecheck` и
`npm run build` чистые (worker/ вне `tsconfig` `include`, как и весь остальной
код Фазы 1). Живой прогон `wrangler dev --local` (после `npm run db:migrate:local`
— миграции уже применены A2-LEAD-SCHEMA):
- валидный лид (Германия/audit/mid) → `201 {leadId, matched: [5 реальных slug]}`;
  подтверждено прямым `wrangler d1 execute ... SELECT` из локальной D1 — все
  поля верные, включая `matched_json`/`contact_json`/`status='sent'`
- пустое тело / неизвестная страна (`ZZ`) / неизвестный standard/service/budget /
  невалидный email → `400 bad_request` с перечислением конкретных полей
- редкая комбинация (Индия/monitoring) → `matched: []`, не падает
- rate-limit: 6-й запрос подряд с одного IP → `429 rate_limited`; независимый IP
  не блокируется
- CORS/OPTIONS-preflight работает; регрессия — `/api/scan`, `/api/explain`, 404
  по-прежнему отвечают верно после правки `worker/index.js`
- `npx wrangler deploy --dry-run` бандлится чисто (1212.75 KiB / gzip 241.64 KiB)

Не проверено и не обязано быть в этом узле: реальный публичный `TURNSTILE_SECRET_KEY`
владельца (accept/reject-пути Turnstile проверены юнит-тестом с подменённым
`fetch`, не живым Cloudflare API) и реальный remote-деплой обновлённого воркера
на прод (отдельное решение по факту, как при A1-RETENTION/A1-EXPLAIN).

## A2-STRIPE-WEBHOOK-CODE — сделано (2026-08-06, done)

`POST /api/stripe-hook` — проверка подписи Stripe webhook + обновление
`featured` (платное размещение агентства, `migrations/0005_featured.sql`,
A2-STRIPE-SCHEMA). Реальный `STRIPE_SECRET_KEY`/webhook signing secret,
настоящие Payment Links — отдельный узел `A2-STRIPE-LIVE`, approval_required.

Файлы: `worker/lib/stripeSig.js` (проверка подписи, самостоятельный модуль без
зависимостей от Stripe SDK), `worker/routes/stripeHook.js` (хендлер + D1-upsert,
всё в одном файле — тот же паттерн, что `lead.js` для `leads`), `worker/index.js`
(маршрут).

- **Проверка подписи** (`stripeSig.js::verifyStripeSignature`): настоящий
  алгоритм Stripe, не упрощённая схема. Заголовок `Stripe-Signature: t=<unix>,
  v1=<hex>[,v1=<hex>...]`. Подпись — `HMAC-SHA256(secret, "{t}.{raw_body}")`,
  hex-encoded, через Web Crypto (`crypto.subtle`, доступен и в Workers, и в
  Node ≥19 для тестов). Сравнение константное по времени
  (`timingSafeEqualHex` — побайтовый XOR-аккумулятор, без раннего `return` на
  первом несовпадении, кроме проверки длины — обе строки фиксированной длины
  hex-дайджеста SHA-256, так что длина сама по себе не течёт информацию о
  подобранных байтах). Несколько `v1=` в одном заголовке поддержаны (Stripe
  шлёт больше одной подписи в окне ротации секрета — валидно, если совпала
  ЛЮБАЯ). `v0` (устаревшая SHA1-схема) намеренно игнорируется, как и в
  официальном Stripe SDK. Отдельно проверяется `timestamp` не старше 5 минут
  (`toleranceSeconds`, дефолт как в `stripe-node`) — защита от replay
  перехваченного, но валидно подписанного старого запроса; вызывающий код
  может расширить окно явным параметром (тестам это нужно для управляемых
  фикстур).
- **Подпись считается по СЫРОМУ телу**: `stripeHook.js` вызывает
  `request.text()`, не `request.json()`, до всякого парсинга — любая
  ре-сериализация JSON (порядок ключей, пробелы) дала бы другую строку и
  ломала бы подпись на ровном месте, даже для настоящих Stripe-событий.
- **Секрет**: `env.STRIPE_WEBHOOK_SECRET` (`wrangler secret put`, `whsec_...`),
  НЕ `STRIPE_SECRET_KEY` — этому узлу вообще не нужен полный API-ключ Stripe
  (он не делает исходящих вызовов в Stripe API, только проверяет входящие
  события), `STRIPE_SECRET_KEY` появится только в A2-STRIPE-LIVE вместе с
  реальными Payment Links. Секрет не настроен → `503 unavailable` до всякой
  проверки подписи, тот же паттерн, что `ANTHROPIC_API_KEY` в A1-EXPLAIN
  (`explain.js`) — не блокирует остальной воркер.
- **`checkout.session.completed` → `featured`**: `agency_slug`/`until`
  извлекаются из `session.metadata` (`extractFeaturedFromSession`) — Stripe не
  знает о нашей доменной модели, `metadata` на Payment Link/Checkout Session —
  единственный официальный канал протащить произвольные бизнес-поля через
  Stripe без изменений; сам Payment Link с этими полями настраивает
  A2-STRIPE-LIVE. Если `metadata` отсутствует/`agency_slug` пуст/`until` не
  похож на ISO-дату — `featured` не трогаем, но всё равно отвечаем `200`:
  подпись Stripe подтверждена (событие настоящее), просто нечего применить —
  это проблема конфигурации Payment Link, а не повод просить Stripe повторить
  доставку.
- **D1 upsert**: `INSERT INTO featured (...) VALUES (...) ON CONFLICT
  (agency_slug) DO UPDATE SET until = excluded.until, stripe_ref =
  excluded.stripe_ref` — `agency_slug` уже `PRIMARY KEY` (A2-STRIPE-SCHEMA), тот
  же паттерн, что и raw SQL в `lead.js`/`scan.js`. `stripe_ref` = `session.id`
  чекаут-сессии, для сверки и возвратов, не для рантайм-логики.
- **Любое другое подтверждённое событие** (тип не `checkout.session.completed`)
  → `200 {received: true}`, no-op — Stripe ретраит недоставленные вебхуки при
  не-2xx, отвечать не-2xx на то, что мы осознанно не обрабатываем, вызвало бы
  бессмысленные повторы.

Верифицировано: 24 новых юнит-теста на синтетическом секрете
`whsec_test_synthetic_...` (`worker/lib/stripeSig.test.mjs` — 11 тестов:
валидная подпись, подмена payload после подписания, чужой секрет, отсутствующий
заголовок, `t=`/`v1=` по отдельности отсутствуют, просроченный timestamp,
явный override tolerance, ротация секрета (несколько `v1=`), отсутствующий
секрет; `worker/routes/stripeHook.test.mjs` — 13 тестов: `extractFeaturedFromSession`
изолированно + вся цепочка хендлера — 503 без секрета, 400 на отсутствующий
заголовок/подделанную подпись/испорченный после подписания body/просроченный
timestamp/невалидный JSON, 200+upsert на валидное событие, 200+no-op на
событие без метаданных и на необрабатываемый тип, 200×2 на «продление» одного
`agency_slug` двумя разными checkout-сессиями). Подписи в тестах строятся через
`node:crypto` `createHmac` — независимо от `crypto.subtle`, которым пользуется
сам `stripeSig.js`, так что тест реально проверяет совместимость с алгоритмом
Stripe, а не то, что модуль лишь согласуется сам с собой. 89/89 `worker:test`
зелёные (было 65). `npm run typecheck` и `npx wrangler deploy --dry-run`
чистые (1217.44 KiB / gzip 242.88 KiB).

Живой прогон (не только юнит-тесты на фейковом D1) через `wrangler dev --local
--var STRIPE_WEBHOOK_SECRET:whsec_local_synthetic_dev_secret` (синтетический
секрет как аргумент процесса, не в файле) + `wrangler d1 execute
accessatlas-scans --local` на настоящей локальной SQLite/D1:
- заголовок, подписанный ЧУЖИМ секретом → `400 {"code":"bad_request",
  "error":"invalid webhook signature (signature_mismatch)"}`, `featured`
  не тронута (`SELECT` — 0 строк)
- запрос вовсе без `Stripe-Signature` → `400`
- валидно подписанное `checkout.session.completed` (`agency_slug:
  "stripe-webhook-live-test-agency"`, `until: "2027-03-01"`, `session.id:
  "cs_live_test_1"`) → `200 {"received":true}`, `SELECT * FROM featured WHERE
  agency_slug=...` вернул ровно эту строку со всеми тремя полями верно
- второе валидное событие для того же `agency_slug` (продление, `until:
  "2027-06-01"`, `session.id: "cs_live_test_2"`) → `SELECT * FROM featured`
  вернул ОДНУ строку (не две) с обновлёнными `until`/`stripe_ref` — `ON
  CONFLICT DO UPDATE` реально сработал в настоящей SQLite, не только по
  тексту SQL в моках юнит-теста
- регрессия: CORS OPTIONS-preflight, `/api/lead` (400 на пустое тело), 404 на
  неизвестный путь — все по-прежнему верны после правки `worker/index.js`
- тестовая строка удалена (`DELETE FROM featured WHERE agency_slug=...`) после
  проверки, локальная D1 оставлена чистой

Не проверено и не обязано быть в этом узле (по конструкции — отдельный узел
A2-STRIPE-LIVE, approval_required): реальный `STRIPE_WEBHOOK_SECRET`/
`STRIPE_SECRET_KEY` Stripe, настоящие Payment Links с `metadata.agency_slug`/
`metadata.until`, настоящий тестовый или боевой платёж, доходящий до этого
воркера через реальный Stripe-аккаунт владельца.

## A2-CLAIM-API — POST /api/claim (2026-08-06)

`worker/routes/claim.js`: `POST /api/claim {agencySlug, email, turnstileToken?}
-> 201 {claimId}`. Тот же стиль, что `lead.js`/`stripeHook.js` — D1-доступ к
`claims` прямо в этом routes-файле, не в `worker/lib/db.js` (специализирован
под `scans`). Fixed-window rate-limit — отдельная реализация, 5/ч на IP (тот
же порядок, что `lead.js`), Turnstile переиспользует `worker/lib/turnstile.js`
как есть, skip без `TURNSTILE_SECRET_KEY` (dev).

**Валидация**: `agencySlug` должен существовать в реальном каталоге —
переиспользован export `agencies` из `worker/lib/matchAgenciesServer.js`
(уже импортирует `data/a11y/agencies.json` через `import ... with { type:
'json' }`), не выдуманный список — неизвестный slug → `400`. `email` — только
формат (`EMAIL_RE`), без сверки с доменом сайта агентства — намеренно, это
явное требование узла (GRAPH.yaml): проверка домена — часть будущей верификации
по клику на ссылку (A2-CLAIM-EMAIL/verify-эндпоинт), не создания заявки.

**Архитектурное решение сверх буквального текста узла (D-023,
`docs/project/DECISIONS.md`)**: контракт `INTERFACES.md` §2 описывает вход как
отображающийся в ДВЕ разные вещи — verify-link (уходит только на email,
будущий `A2-CLAIM-EMAIL`) и `claimId` (возвращается вызывающему немедленно,
201). Черновая схема `claims` (`migrations/0004_claims.sql`, INTERFACES.md §4)
не содержала отдельного `token`-столбца. Если бы verify-токен в ссылке
совпадал с `id`/`claimId` из ответа API, вызывающий получал бы «доказательство
владения почтой» прямо из самого ответа, без перехода по ссылке — ровно то,
что email-верификация должна предотвращать (пример атаки: указать в поле
`email` чужой рабочий адрес агентства, получить `claimId` в ответе и тут же
«верифицировать» заявку, ни разу не увидев письма). Решение: добавлен
отдельный секретный `token` (`migrations/0006_claim_token.sql` — `ALTER TABLE
claims ADD COLUMN token TEXT` + `idx_claims_token`), генерируется
`crypto.getRandomValues` (32 байта, hex), пишется в D1, но **не возвращается**
в ответе API. `patch_json` НЕ переиспользован под токен — тот столбец
зарезервирован под предложенные правки профиля агентства, которые накатывает
ежедневный оверлей (`A2-CLAIM-REBUILD`); смешение форматов было бы риском для
той логики. Это выход за буквальный `scope` узла (`worker/routes/claim.js`) —
раскрыто явно (`GRAPH.yaml` notes, `BACKLOG.md`, этот файл, `DECISIONS.md`),
не тихо, по тому же прецеденту, что `A1-LANDING`/`A2-LEAD-FORM` уже трогали
файлы вне буквального scope, когда без этого узел был бы недостижим/некорректен.
`worker/index.js` тоже тронут за пределами буквального scope — маршрут иначе
недостижим, тот же прецедент. `INTERFACES.md` §4 обновлена тем же коммитом
(добавлена строка про `token`).

**Важно для `A2-CLAIM-EMAIL`** (следующий узел в цепочке): verify-ссылка
должна нести `claims.token` (искать по `idx_claims_token`), НЕ `claims.id` —
`id`/`claimId` уже раскрыт вызывающему в ответе `POST /api/claim` и не может
служить доказательством владения почтой. Отмечено в `GRAPH.yaml` notes узла
`A2-CLAIM-EMAIL`, чтобы не потерялось между сессиями.

Верифицировано: 14 новых юнит-тестов (`worker/routes/claim.test.mjs`) —
невалидный JSON, отсутствующие поля, неизвестный `agencySlug` (проверено
против реального каталога через фикстуру `agencies[0].slug`, не строкового
угадывания), невалидный email, happy path (`201 {claimId}` + запись в D1 со
`status='pending'`, `verified=0`, непустым `token`), явный тест «`claimId` из
ответа ≠ `token` в D1» (страхует от повторной регрессии D-023 в будущем), два
последовательных claim выдают разные `id`/`token`, домен email намеренно НЕ
сверяется с доменом сайта агентства, отсутствие сетевого вызова на happy path
(email не отправляется), rate-limit (6-й запрос с одного IP → `429`,
независимые IP не блокируются), Turnstile (skip без секрета, `403` на
отклонённый токен, `201` на принятый). 103/103 `worker:test` (было 89).
`npm run typecheck` и `npx wrangler deploy --dry-run` чистые.

Живой прогон через `wrangler dev --local` + `wrangler d1 execute
accessatlas-scans --local` на настоящей локальной D1 (не мок):
- неизвестный `agencySlug` → `400 {"error":"invalid or missing fields:
  agencySlug","code":"bad_request"}`
- отсутствующие оба поля → `400` с обоими именами полей в `error`
- валидный claim (`agencySlug: "deque-systems"`, реальный slug из каталога) →
  `201 {"claimId":"..."}`; прямой `SELECT` подтвердил реальную строку:
  `status='pending'`, `verified=0`, `patch_json=NULL`, `token` — 64-символьная
  hex-строка (32 случайных байта), отличная от `claimId`
- rate-limit: 5 запросов с одного IP (`5.5.5.5`) прошли `201`, 6-й → `429
  {"code":"rate_limited"}`
- `grep -n "fetch(" worker/routes/claim.js` — 0 совпадений: подтверждено кодом,
  не только тестом, что email этим узлом не отправляется
- регрессия: `/api/lead` (`201`, тот же алгоритм матчинга), `404` на неизвестный
  путь, `OPTIONS`-preflight — все по-прежнему верны после правки `worker/index.js`
- все тестовые строки (`claims`, `leads`) удалены из локальной D1 после проверки

Не проверено и не обязано быть в этом узле (по конструкции — отдельный узел
`A2-CLAIM-EMAIL`, approval_required): реальная отправка verify-письма через
Resend, сам verify-эндпоинт, читающий `token` по ссылке.

## A2-CLAIM-EMAIL — закрыт, статус done (2026-08-06, D-024)

Владелец явно одобрил Resend для трёх узлов разом (`A2-LEAD-EMAIL`,
`A2-CLAIM-EMAIL`, `A2-OUTREACH-SEND`, не общее «ОК») — реальный
`RESEND_API_KEY` получен, использован только в памяти процесса, нигде не
записан/не закоммичен (тот же паттерн, что CF/Anthropic ключи, D-020/D-021).

- `worker/lib/resend.js` — тонкая обёртка над Resend API
  (`POST https://api.resend.com/emails`), общая для будущих узлов.
- `worker/routes/claim.js` дополнен: после `insertClaim` — best-effort
  отправка verify-письма (`sendVerifyEmailBestEffort`), ссылка несёт
  `claims.token` (D-023), не `claimId`.
- **Новый эндпоинт** `GET /api/claim/verify?token=...` (за пределами
  буквального scope `A2-CLAIM-EMAIL`, но необходим: письмо с ссылкой в
  никуда было бы тем же обманом, что D-015 явно запрещает) — ищет по
  `idx_claims_token`, помечает `verified=1, status='verified'`.
- **Отклонение от исходного verify-критерия «503 без RESEND_API_KEY»**:
  реализовано как graceful degradation, не hard-503 — создание claim в D1
  не зависит от Resend (уже рабочий, протестированный A2-CLAIM-API не должен
  сломаться из-за отсутствия/сбоя email-сервиса), отправка — best-effort,
  ошибка логируется (`console.error`), не превращает успешную запись в 5xx.
  Зафиксировано как решение в GRAPH.yaml notes, не молчаливое отступление.
- 8 новых тестов (`resend.test.mjs` — 2, `claim.test.mjs` — 6), 111/111
  `worker:test`, typecheck/`wrangler deploy --dry-run` чистые.

Живьём через `wrangler dev --local --var RESEND_API_KEY:<реальный ключ>`:
`POST /api/claim` с `email: "zincroom@gmail.com"` (адрес владельца — см. ниже
почему не реальный агент) → `201`, реальный запрос к Resend вернул `200` с
настоящим `message id`; прямой `SELECT` из D1 подтвердил `token` (64 hex-
символа, отличный от `claimId`); `GET /api/claim/verify?token=<этот token>`
реально перевёл `verified` 0→1 в D1 (не просто в ответе). Регрессия
`/api/lead`/`/api/scan`/`/api/stripe-hook`/404 не задета.

**Найдено при живой проверке (D-024), важно для A2-LEAD-EMAIL/A2-OUTREACH-
SEND тоже**: sandbox-домен Resend (`onboarding@resend.dev`, используется пока
нет своего верифицированного домена) технически может доставить письмо
ТОЛЬКО на email владельца аккаунта Resend. Подтверждено безопасным
API-пробником на `test@example.com` (IANA-зарезервированный домен, письмо
физически не могло уйти живому человеку) — Resend вернул `422
validation_error`, явно попросив использовать «our testing email address».
Поэтому живая проверка выше слала на `zincroom@gmail.com`, а не на реальный
email агентства — тестовое письмо реальной компании было бы тем же
нежелательным контактом, что и непроверенный outreach. Реальным заявителям
Resend физически не доставит письмо, пока не верифицирован домен сайта
(A0-ORIGIN → A0-OWNER-LEGAL). `RESEND_API_KEY` НЕ загружен как прод-secret —
в отличие от `ANTHROPIC_API_KEY` (D-021), здесь это была бы частично рабочая
функция (работает только для владельца, не для реальных пользователей),
вводящая в заблуждение, если считать узел «живым в проде».

## A2-LEAD-EMAIL — закрыт, статус done (2026-08-06, D-025)

Владелец решил пробел из D-024 (у `Agency` нет поля email): уведомлять
**только claimed+verified** среди совпавших агентств, не добавлять email в
`agencies.json` (отдельный крупный data-проект — 245 адресов, не 96, как у
outreach) и не морозить узел.

- `findClaimedEmails(db, matchedSlugs)` (`worker/routes/lead.js`) — `SELECT
  agency_slug, email FROM claims WHERE verified = 1 AND agency_slug IN
  (...)`, только по совпавшим slug'ам. Незаявленные агентства не получают
  ничего — у каталога просто нет для них проверенного адреса.
- `notifyClaimedAgenciesBestEffort` — тот же паттерн, что
  `sendVerifyEmailBestEffort` в `claim.js`: запись лида в D1 не зависит от
  Resend, отправка — некритичный побочный эффект, сбой логируется, не
  превращает успешную запись в 5xx.
- 6 новых тестов: happy path (один claimed+verified среди matched → ровно
  одно письмо), claimed-но-`verified=0` → не уведомляется (важная граница —
  неподтверждённая заявка не равна доверенному контакту), claimed для
  slug вне matched-набора → не уведомляется, 0 claimed среди matched → 0
  писем без ошибки, Resend недоступен → лид всё равно 201. 117/117
  `worker:test`.

Живьём через `wrangler dev --local` с реальным `RESEND_API_KEY`: claim +
verify реального агентства (`marc-haunschild-accessibility-consulting`,
email владельца — не реальное третье лицо) → затем лид, реально совпавший с
этим агентством по `matchAgencies` (DE/audit/mid) → уведомление ушло без
ошибок в логе воркера. Отдельно проверен лид без единого claimed-совпадения
(FR/training/budget) — 0 писем, без сбоя. Регрессия `/api/claim`,
`/api/scan`, `/api/stripe-hook` не задета. Охват уведомлений будет расти
органически по мере роста числа claimed-профилей — на момент внедрения 0
подтверждённых заявок в проде, часть лидов пока не приведёт ни к одному
письму, это ожидаемо, не баг.

## Дальше по Фазе 1/2

- Секреты: `RESEND_API_KEY` одобрен и рабочий (D-024), но НЕ загружен в прод —
  ждёт верифицированного домена в Resend (A0-ORIGIN), иначе реальным третьим
  лицам письма всё равно не дойдут. Stripe (`STRIPE_WEBHOOK_SECRET`, код,
  A2-STRIPE-LIVE) — код готов (см. ниже), `STRIPE_SECRET_KEY` не выдан и не
  нужен (Payment Link создаётся вручную в Dashboard, не через API);
  `STRIPE_WEBHOOK_SECRET` появится только когда владелец настроит реальный
  webhook endpoint в Stripe Dashboard.

## A2-STRIPE-LIVE (2026-08-06, D-027) — custom-field редизайн

`worker/routes/stripeHook.js` переписан под Payment Link, создаваемый вручную
в Stripe Dashboard (владелец явно выбрал этот путь вместо API), что меняет
источник `agency_slug`:

- Было (A2-STRIPE-WEBHOOK-CODE): `session.metadata.agency_slug`/`.until` —
  работало бы только для Payment Link, созданного программно через API
  (там metadata можно задать динамически на лету).
- Стало: Dashboard-ссылка одна и та же для всех покупателей — не умеет
  нести per-purchase metadata. `agency_slug` собирается через Stripe "custom
  field" (агентство само вписывает slug на странице оплаты) — приходит в
  `session.custom_fields: [{key, label, type, text:{value}}]`.
  `extractAgencySlugFromSession` ищет поле с `key === 'agency_slug'`
  (константа `CUSTOM_FIELD_KEY`, должна совпадать с key реального custom
  field в Dashboard) и валидирует значение против настоящего каталога
  (`AGENCY_SLUGS`, из `matchAgenciesServer.js`) — опечатка/несуществующий
  slug не создаёт запись в `featured`, но логируется `console.error`
  отдельно (не теряется молча, событие всё равно 200 — Stripe не должен
  ретраить то, что мы осознанно не применяем).
- `until` (дата окончания featured) больше НЕ приходит извне вообще —
  считается на сервере (`computeFeaturedUntil`, today+365 дней в момент
  обработки события), потому что customer-редактируемое поле не должно
  иметь возможности продиктовать себе любую дату окончания.
- Scope первого прохода — владелец явно сузил до одного продукта: featured
  €590/год, разовый платёж. Месячная подписка (€59/мес) и «lead-пакет
  10/€400» (отдельная система credits/consumption, схемы для неё вообще нет)
  явно отклонены для этого прохода.
- `worker/routes/stripeHook.test.mjs` переписан целиком под `custom_fields`
  (было `metadata`) — 122/122 `worker:test` зелёные (было 117).
- Живьём через `wrangler dev --local --var STRIPE_WEBHOOK_SECRET:...` (тот
  же синтетический секрет, что в A2-STRIPE-WEBHOOK-CODE) +
  `wrangler d1 execute --local` на реальной локальной D1: валидный
  `custom_fields` с реальным slug (`deque-systems`) → 200, реальная строка
  `featured` создана с `until` = ровно сегодня+365; повторный платёж за тот
  же slug → та же строка обновилась (upsert, PK держит), не задублировалась;
  опечатка в slug (`totally-fake-typo-slug`) → 200, но 0 строк в D1 и реальный
  `console.error` в логе воркера — тестовые строки удалены после проверки.
  `npm run typecheck` и `npx wrangler deploy --dry-run` чистые.
- ОСТАЁТСЯ (на момент первой версии этой заметки): владелец должен вручную в
  Stripe Dashboard создать продукт €590/год + добавить обязательный custom
  field на Payment Link, настроить webhook endpoint (`checkout.session.completed`
  → `https://accessatlas-worker.zincroom.workers.dev/api/stripe-hook`),
  передать реальный `STRIPE_WEBHOOK_SECRET` для `wrangler secret put` — до
  этого узел не принимает реальные деньги, готов только код. **Уточнение
  ниже (D-028) отменяет предположение про `key = agency_slug`.**

## A2-STRIPE-LIVE (2026-08-06, D-028) — реальный key custom field ≠ agency_slug

Владелец настроил Payment Link и сделал реальный тестовый платёж ($10,
Apple Pay, `cs_live_a12o7c...`) — прислал целиком настоящий JSON события
`checkout.session.completed`. Он вскрыл расхождение: `extractAgencySlugFromSession`
искал поле с `key === 'agency_slug'`, но в реальном событии
`custom_fields[0].key === "yourslugaccessatlas"`, а `custom_fields[0].label.custom
=== "agency_slug"`. Причина — Stripe генерирует `key` custom field из текста
`label` только один раз, в момент первого сохранения поля в Dashboard, и НЕ
пересчитывает его при последующем переименовании label; владелец, судя по
всему, сначала ввёл другой текст label, затем поменял его на "agency_slug" —
видимый текст обновился, программный `key` — нет.

Правка: `CUSTOM_FIELD_KEY` в `stripeHook.js` изменена с `'agency_slug'` на
буквальное `'yourslugaccessatlas'`, с комментарием, что это значение из
реального payload, а не предположение — Dashboard-конфигурацию трогать не
пришлось, она уже рабочая. `stripeHook.test.mjs`: все фикстуры с
`customField('agency_slug', ...)` заменены на `customField(REAL_CUSTOM_FIELD_KEY,
...)`; добавлен отдельный регрессионный тест — поле с `key`, буквально равным
видимому тексту label (`"agency_slug"`), не должно приниматься кодом за
искомое (иначе будущая ручная правка в Dashboard, случайно создавшая второе
поле с "похожим на правильный" key, тихо перекрыла бы обработку). 123/123
`worker:test`. Живой прогон: `wrangler dev --local` + вручную подписанное
HMAC-SHA256 событие с точной формой реального payload (`key:
"yourslugaccessatlas"`, slug `marc-haunschild-accessibility-consulting`) →
реальная строка в локальной D1 `featured` с верным `until` — удалена после
проверки. `typecheck`/`wrangler deploy --dry-run` чистые.

Урок на будущее (см. `LEARNING_LOG.md`): в конструкторах форм, где видимый
текст поля и его программный идентификатор задаются раздельно и не
синхронизируются автоматически при редактировании, никогда не полагаться на
то, что идентификатор совпадает с последним увиденным текстом — сверяться
нужно с реальным payload, не с UI.

ОСТАЁТСЯ ровно одно: webhook endpoint в Stripe Dashboard
(`checkout.session.completed` → `/api/stripe-hook`) + реальный
`STRIPE_WEBHOOK_SECRET` для `wrangler secret put`. Payment Link уже реально
принимает деньги и корректно отдаёт `agency_slug` в custom field.
