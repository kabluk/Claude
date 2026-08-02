# Деплой на Cloudflare Pages · 29 июля 2026

Переезд с Netlify: у Netlify новый тариф берёт 15 кредитов за каждый
деплой (300/мес ≈ 20 деплоев, потом заморозка). Cloudflare Pages —
без оплаты за деплой, безлимитный трафик, 500 сборок/мес.

## Что уже готово в репозитории

- `functions/index.js` — серверный редирект с `/` по языку браузера
  (заменяет правило Netlify, которое Cloudflare не понимает).
- `_headers` (генерит `gen-sitemap.mjs`) — CSP с sha256-хэшами,
  Cloudflare читает тот же формат, что Netlify.
- `.nvmrc` = 22 — версия Node для сборщика Cloudflare.
- Запасные пути на случай, если функция не задеплоится: `netlify.toml`
  (для Netlify) и `dist/index.html` — выбор языка без сервера.

## Подключение (экран «Ship something new»)

1. **Connect GitHub** → репозиторий **kabluk/Claude**.
2. **Production branch:** `claude/idea-to-saas-service-2azs6m`
   (наша рабочая ветка; либо сначала слить в основную и указать её).
3. Настройки сборки:
   - Framework preset: **None** (или Vite)
   - Build command: **`npm run build`**
   - Build output directory: **`dist`**
   - Root directory: пусто (корень репозитория)
   - `functions/` Cloudflare подхватит сам.
4. **Environment variables:**
   - Пока идёт проверка (не индексируется): переменные не нужны —
     сборка ставит `noindex` и `robots: Disallow`.
   - **Для запуска (индексация вкл):** добавить `PUBLIC_LAUNCH` = `1`
     в Production и пересобрать.
5. Deploy. Первый билд даст адрес вида `detnav-xxx.pages.dev` — на нём
   всё проверяем.

## Домен detnav.com

1. В проекте Pages → **Custom domains** → Add → `detnav.com`.
2. Проще всего перевести DNS домена на Cloudflare: добавить сайт в
   Cloudflare, в GoDaddy сменить неймсерверы на два, которые даст
   Cloudflare. Тогда домен и апекс (без www) настроятся сами,
   сертификат Cloudflare выпустит автоматически. (Неймсерверы всё
   равно нужно было менять — просто на Cloudflare вместо Netlify.)

## Проверка после деплоя

- `https://<...>.pages.dev/` уводит на язык браузера (`/ru/`, `/es/`, `/en/`).
- Прямой заход на `/ru/` открывается, аккордеон-индекс и опрос работают.
- `curl -I .../ru/` показывает `Content-Security-Policy` и (до запуска)
  `X-Robots-Tag: noindex`.
- `curl .../robots.txt` — `Disallow` до запуска, `Allow` после
  `PUBLIC_LAUNCH=1`.

## Netlify

Трогать не нужно: конфиг (`netlify.toml`) остаётся, сайт сам
разморозится в начале следующего месяца и будет запасным. Аналитику
нигде не включать (правило №1).
