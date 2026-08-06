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
- Тесты: `npm run worker:test` → `node --test worker/**/*.test.mjs` (15/15 зелёных).
  ⚠ `node --test worker` (без glob) на этой версии Node находит только 1 тест —
  баг discovery, не тестов; скрипт использует explicit glob, не трогать без причины.
- **errorCode** (D-013, `worker/lib/errors.js`): классификация сырой ошибки скана
  в маленький enum (`unreachable|refused|tls|timeout|blocked|internal`) паттерн-
  матчингом по тексту. `error` (сырой текст) остаётся для отладки, `errorCode` —
  то, на чём фронтенд строит понятные сообщения (VISION.md UX 4). Миграция
  `0002_error_code.sql` (аддитивная, `ALTER TABLE`, не трогает `0001_init.sql`).
  6 юнит-тестов.

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
npx wrangler d1 migrations apply accessatlas-scans --remote
npx wrangler secret put TURNSTILE_SECRET_KEY         # опционально для dev
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

## Дальше по Фазе 1

- `A1-EXPLAIN`: Claude Haiku + KV-кэш `ruleId×locale`, секрет Anthropic API key.
- Секреты: Anthropic API key, Resend, Stripe — только в Worker secrets, не в репо.
- TBD: retention сканов (GDPR, R6) — сейчас `scans` не чистится по TTL.
