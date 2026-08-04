# Niche Research — состояние проекта

> **Файл-указатель для продолжения работы в новой сессии.** Здесь: что сделано, что решено, где лежат данные и что делать дальше. Обновляется при каждом значимом шаге.

Последнее обновление: 2026-08-04 (Days 1–3 complete, 156 agencies collected and merged).

## Текущий статус

**Выбранная ниша: каталог агентств аудита цифровой доступности (EAA / WCAG / ADA / BFSG / RGAA).**
Blue ocean подтверждён живыми SERP-проверками (US, UK, DE, FR, PL — ни одного каталога в топ-10), спрос замерен DataForSEO по 8 рынкам: **суммарно ≈45 000+/мес** (Германия — крупнейший рынок: кластер BFSG/BITV ≈23 000/мес; US: section 508 compliance 8 100 @ $9.86, vpat 5 400 @ $29.92, CPC до $86). Вердикт: **🔥 BUILD NOW, 7.9/10**.

**`/deepdive` ЗАВЕРШЁН** → `docs/deepdive-accessibility-directory.md`: архитектура под стек detnav (Vite-SSG + Cloudflare Workers/D1), TS-схема данных, JSON-LD, URL/hreflang, план сбора 500+ агентств (IAAP, BIK-Prüfstellen, UK G-Cloud, декларации доступности гос-сайтов ЕС с именем аудитора), roadmap и 30-дневный план.

**Идёт исполнение 30-дневного плана.** Прогресс:
- ✅ **Дни 1–2 (фундамент):** `data/a11y/types.ts` (схема), `data/a11y/taxonomies.json` (услуги/стандарты/страны с законами), `scripts/build-a11y.mjs` (валидация+дедуп+индексы+route-манифест+отчёт полноты, npm-скрипт `build:a11y`). Билд проходит.
- ✅ **Дни 3–3.5 (сбор данных):** Независимо собрано 152 агентства через 4 параллельных агента:
  - BITV Prüfstellen (DE): 17 записей
  - IAAP org members: 15 записей (6 дедупированы с существующими)
  - Конференции (CSUN/axe-con/M-Enabling): 17 записей
  - EU фирмы (NL/ES/IT/IE/AT/BE/Nordics): 47 записей
  - UK Digital Marketplace: 26 записей (2 дедупированы)
  - US seed (accessibility.com, AskJAN): 30 записей (5 дедупированы)
  - **Итого:** 156 агентств (17 seed + 139 новых), 20 стран, 92 list-страницы (57 indexable @≥3)
  - Схема валидирует 100%, дубликаты по нормализованному домену, данные честные (нет выдуманных полей).

- ✅ **Дни 8–12 (MVP-сайт):** `a11y-site/` — отдельный Vite-SSG сайт (второй продукт в репо, свой vite-конфиг, делит node_modules с detnav). **258 статических страниц**: профили агентств (ProfessionalService + BreadcrumbList JSON-LD, источники, похожие), страны-хабы (закон + дата вступления), комбо страна×услуга (keyword-URL вида /germany/accessibility-audit/), услуги, стандарты, ярусы. Клиентские фильтры (услуга/стандарт/сертификация/цена + поиск) поверх SSG-списка. noindex,follow ниже порога ≥3, sitemap 223 URL без noindex-страниц. Сборка: `npm run build:a11y-site`, дев: `npm run dev:a11y-site`. **Домен — заглушка `a11y-directory.example`** (TODO в `a11y-site/src/lib/seo.tsx` и `scripts/gen-a11y-sitemap.mjs`).

**Следующий шаг (по 30-дневному плану):**
1. **Дни 4–7 (пропущенный блок, можно параллельно):** обогащение данных — города, priceBand, сертификации, описания (только по фактам из sourceRefs).
2. **Дни 13–20:** 12 редакционных гайдов (BFSG DE 5.4k/мес, VPAT US 5.4k, Section 508 US 8.1k, EAA по странам, RGAA FR, audyt WCAG PL, «audit vs overlay»...) + шаблон GuidePage.
3. **Дни 21–23:** купить домен → заменить заглушку origin, деплой на Cloudflare Pages, лид-форма (Worker + D1), Stripe Payment Links для featured, claim-outreach по базе.
4. **Дни 24–27:** декларации доступности гос-сайтов EU через Firecrawl (уникальный датасет gov-declared-auditor, +30–80 агентств).

Проверка билда каталога: `node scripts/build-a11y.mjs` (флаг `--strict` — все замечания о полноте).

**Запасная ниша №2:** DGSA / опасные грузы (ЕС) — консультанты + учебные центры (балл 8.1, но трафик дешевле).

## Хронология и решения

1. **Установлен агент niche-finder** (`.claude/agents/niche-finder.md`) + слэш-команды `/ideas /analyze /deepdive /discover /compare /expand /roadmap` (`.claude/commands/`).
2. **`/discover` (международные ниши):** 78 кандидатов → топ-10. Лидеры: EU Authorized Rep/GPSR (8.4), EPR-комплаенс (8.1), присяжные переводчики (7.9). Полный отчёт: `research/REPORT-01-discover.md`.
3. **`/analyze` GPSR и EPR:** живая проверка выдачи понизила обе ниши 🔥→🟢 (7.1) — за 18 мес. в оба сегмента зашли AI-pSEO конкуренты (cruxi.ai, dutyscope.com, eldris и др.). Вывод: строить можно только как дифференцированный «EU Market Access Hub». Отчёты: `research/REPORT-02-analyze-gpsr.md`, `research/REPORT-03-analyze-epr.md`.
4. **Подключён DataForSEO** (см. «Инфраструктура»). Замерены реальные объёмы GPSR/EPR (US/UK/DE): спрос сильно ниже оценок (микро-ниши, но CPC $33–49 подтверждает ценность). Данные: `research/volumes-*.json`.
5. **Охота на голубой океан** (2 агента, ~75 кандидатов, 33 живых SERP-проверки): найдено 7 подтверждённых blue-ocean ниш. Сводный отчёт: `research/REPORT-04-blue-ocean.md`. **Решение: строить каталог аудита доступности** (CPC-взвешенная ценность трафика ~$100k/мес против ~$30k/мес у DGSA).

## Инфраструктура

- **DataForSEO API:** логин `zincroom@gmail.com`, баланс ~$525 (август 2026). Пароль — в переменных окружения Claude Code (`DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`), НЕ хранить в репо. Требование среды: в Network access окружения должен быть разрешён домен `api.dataforseo.com`.
- **Скрипт:** `scripts/seo-data.mjs` — `balance` | `volume --keywords <file.json> --location US|UK|DE|ES|FR|IT|NL|PL [--lang xx]` | `serp --query "..." --location ...`. Работает через curl (Node fetch игнорирует прокси). Volume-запрос ≈ $0.05 (батч до ~50 ключей), SERP ≈ $0.002.
- **Открытые вопросы:** у DataForSEO запрошен возврат $475 излишнего депозита (внесено $525 вместо $50); после стабилизации — сбросить API-пароль (засветился в чате/скриншоте) и обновить переменную окружения.

## Как продолжить в новой сессии

Скажите Claude: «Прочитай research/STATE.md и продолжи работу». Дальше по этапу:
- Если `docs/deepdive-accessibility-directory.md` существует — читать его и переходить к исполнению 30-дневного плана.
- Проверка API: `node scripts/seo-data.mjs balance` (env-переменные должны быть в окружении).
- Все сырые замеры: `research/volumes-*.json` (GPSR/EPR), `research/bo-*.json` (blue ocean), `research/dd-*.json` (deepdive).

## Карта файлов

| Файл | Что это |
|---|---|
| `research/REPORT-01-discover.md` | /discover: топ-10 международных ниш |
| `research/REPORT-02-analyze-gpsr.md` | /analyze: EU Authorized Rep / GPSR |
| `research/REPORT-03-analyze-epr.md` | /analyze: EPR-комплаенс |
| `research/REPORT-04-blue-ocean.md` | Охота на голубой океан: 7 финалистов + отсевы |
| `docs/deepdive-accessibility-directory.md` | /deepdive выбранной ниши (архитектура + план) |
| `research/keywords-*.json`, `volumes-*.json`, `bo-*.json`, `dd-*.json` | Сырые данные замеров |
| `scripts/seo-data.mjs` | DataForSEO-хелпер |
| `.claude/agents/niche-finder.md` | Агент с методикой оценки |
