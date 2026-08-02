# Деплой на Cloudflare (Workers со статикой) · 29 июля 2026

Переезд с Netlify: у Netlify новый тариф берёт 15 кредитов за деплой
(300/мес ≈ 20 деплоев, потом заморозка). Cloudflare — без оплаты за
деплой, безлимитный трафик, 500 сборок/мес.

Cloudflare убрал отдельный поток Pages и гонит всех в **Workers**.
Поэтому проект оформлен как **Worker со Static Assets**: сайт отдаётся
из `dist/`, а маленький воркер делает серверный редирект с корня.

## Что в репозитории

- `wrangler.jsonc` — конфиг: `assets.directory = ./dist`, привязка
  `ASSETS`, `not_found_handling: "404-page"`, `run_worker_first: ["/"]`.
- `worker.js` — воркер: на `/` редиректит по `Accept-Language` на
  `/en|es|ru/`, остальное отдаёт `env.ASSETS.fetch()`.
- `_headers` (генерит `gen-sitemap.mjs`) — CSP с sha256-хэшами.
  Workers Static Assets применяет `_headers` нативно к статике.
- `.nvmrc` = 22 — версия Node для сборщика.
- Запасной путь без сервера: `dist/index.html` (RootRedirect, выбор языка).

Проверено локально: `npx wrangler deploy --dry-run` читает 289 файлов
из `dist`, собирает воркер, привязывает `ASSETS` — ошибок нет.

## Подключение (экран Workers «Set up your application»)

Тот самый экран с полями Build/Deploy command:
- Repository: **kabluk/Claude**
- **Branch: `claude/idea-to-saas-service-2azs6m`** — ОБЯЗАТЕЛЬНО
  сменить с `main` (по умолчанию репозиторий отдаёт `main`, а весь
  код на нашей ветке; иначе соберётся пустышка).
- Project name: `detnav`
- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy` (уже подставлено)
- API-токен создастся автоматически (синяя плашка) — оставить как есть.
- Переменные окружения: пока пусто → сборка ставит `noindex`.
  Для запуска добавить `PUBLIC_LAUNCH` = `1` и пересобрать.
- **Deploy.**

## Домен detnav.com

Проект → Settings → Domains & Routes (или Custom domains) → добавить
`detnav.com`. Проще перевести DNS на Cloudflare: добавить домен в
Cloudflare, в GoDaddy сменить неймсерверы на выданные Cloudflare.
Сертификат выпустится сам.

## Проверка после деплоя

- `https://<...>.workers.dev/` уводит на язык браузера (`/ru/` и т.д.).
- `/ru/` открывается, аккордеон-индекс и опрос работают.
- `curl -I .../ru/` показывает `Content-Security-Policy` и (до запуска)
  `X-Robots-Tag: noindex`.
- `curl .../robots.txt` — `Disallow` до запуска, `Allow` после `PUBLIC_LAUNCH=1`.

## Netlify

Не трогаем: `netlify.toml` остаётся, сайт сам разморозится в начале
месяца, будет запасным. Аналитику нигде не включать (правило №1).
