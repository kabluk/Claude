# Niche Research — состояние проекта

> **Файл-указатель для продолжения работы в новой сессии.** Здесь: что сделано, что решено, где лежат данные и что делать дальше. Обновляется при каждом значимом шаге.

Последнее обновление: 2026-08-04.

## Текущий статус

**Выбранная ниша: каталог агентств аудита цифровой доступности (EAA / WCAG / ADA).**
Blue ocean подтверждён живыми SERP-проверками, спрос замерен DataForSEO.
Идёт этап: `/deepdive` → см. `docs/deepdive-accessibility-directory.md` (архитектура, план запуска).

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
