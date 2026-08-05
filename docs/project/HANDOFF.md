# HANDOFF — что нужно знать новой сессии

Обновлено: 2026-08-05 · Проект: **AccessAtlas** (ветка `accessatlas`; в `main` — чужой
проект detnav, не трогать). Рабочая ветка итерации: `claude/accessatlas-architecture-sk6tcj`.

## Как продолжить

> Работай в ветке от `accessatlas`. Прочитай `docs/project/HANDOFF.md` и `STATUS.md`,
> затем `/project-orchestrator Продолжи проект: выбери следующий незаблокированный узел
> из docs/project/GRAPH.yaml, выполни через /task-loop, обнови handoff.

Проверка среды: `npm install && node scripts/build-a11y.mjs` (ожидать: 253 агентства).

## Что это

Платформа web-доступности (EAA/WCAG/ADA/BFSG/RGAA), эволюция
**Directory → Decision Engine → Lead Marketplace → Vertical SaaS** (VISION.md, D-003).
Слой 1 (каталог, 383 статические страницы) построен, не задеплоен. Слои 2–4 не начаты.

## Состояние на сегодня

- Данные: **A0-ENRICH выполнен** (commit `e0c9a85`) — описания 81→200/253 (79.1%).
  До порога 90% (снятие noindex) остаётся ~53 профиля → узел A0-DESC-REST (ready).
- **Найдено и частично исправлено:** CI гарантированно красный — `ci.yml` вызывает
  3 несуществующих скрипта (lint:upl, lint:minimize, check-links.mjs); отсутствовавший
  `package-lock.json` уже добавлен. Узел A0-CI-FIX (ready), блокирует A0-DEPLOY.
- Блокеры на владельце: реквизиты Imprint + домен (узел A0-OWNER-LEGAL).
- Сканер (A1-SCAN) технически независим — можно строить параллельно Фазе 0,
  но требует approval (платные фичи Cloudflare).

## Ключевые файлы

- `docs/project/GRAPH.yaml` — граф задач (8 узлов, 2 ready: A0-ENRICH, A1-SCAN)
- `docs/project/BACKLOG.md` — все фазы; `ROADMAP.md` — критерии выхода фаз
- `docs/project/domains/architecture.md` — целевая архитектура платформы (главный документ)
- `docs/project/INTERFACES.md` — схемы API/D1/типов для слоёв 2–4
- `research/STATE.md` — legacy-статус каталога (подробности Рубежей 1–3)
- `docs/deepdive-accessibility-directory.md` — обоснование ниши (7.9/10), монетизация

## Правила

- Данные: ничего не выдумывать; enrich заполняет только пустые поля; excluded.json уважать.
- Индексацию не открывать до покрытия описаний ≥90% (риск R1).
- Архитектурные изменения — только с записью в DECISIONS.md.
- Деплой/платные ресурсы/рассылки — только с явного разрешения владельца.
- Агенты возвращают компактный контракт (≤40 строк), детали пишут в свой domains/*.md.

## Следующие шаги (по приоритету)

1. `/task-loop A0-DESC-REST` — дописать оставшиеся ~53 описания (обход сайтов, только факты).
2. `/task-loop A0-CI-FIX` — вернуть CI в зелёное состояние (недостающие линтеры/скрипт).
3. Спросить владельца: реквизиты Imprint + домен (снимает A0-OWNER-LEGAL → A0-ORIGIN → A0-DEPLOY).
4. При approval — `/task-loop A1-SCAN` (сканер MVP, начало Decision Engine).
