# Домен: devops

Обновлено: 2026-08-05 · Владелец: devops-engineer

- CI: `.github/workflows/ci.yml` на ветке — **зелёный**. Пайплайн: `npm ci` →
  `typecheck` → `worker:test` (122) → `scripts:test` (7) → `build` →
  `check-links` → `audit-a11y`. `worker:test`/`scripts:test` шаги добавлены
  2026-08-06 (A2-CLAIM-REBUILD, D-026) — до этого `worker/`/`scripts/` тесты
  запускались только локально, CI их вообще не видел, реальный пробел, не
  гипотетический. Счёт `worker:test` вырос со 117 до 122 при редизайне
  `stripeHook.js` под Stripe custom fields (A2-STRIPE-LIVE, D-027).
- Деплой: НЕ настроен. План (A0-DEPLOY): Cloudflare Pages, прод-ветка `accessatlas`,
  build command `npm run build`, output `dist/`, конвенция `dist/404.html` уже соблюдена.
- **A2-CLAIM-REBUILD — status review (2026-08-06, D-026)**: `scripts/apply-
  d1-overlay.mjs` написан и живьём проверен против реальной локальной D1 —
  накладывает `claimed`/`featured` из D1 на `agencies.json` перед `build-
  a11y.mjs`, снимает истёкший `featured` (проверено удалением D1-записи),
  идемпотентен (побайтовое совпадение повторного прогона). Владелец явно
  одобрил узел «в проде» — approval валиден и сохраняется на будущее. НЕ
  подключён к реальному CI-cron: `A0-DEPLOY` (цель деплоя) сам заблокирован
  `A0-OWNER-LEGAL` — добавлять расписание сейчас значило бы либо падать на
  отсутствующем `CLOUDFLARE_API_TOKEN`-секрете GitHub Actions, либо собирать
  каталог в пустоту, никуда не публикуя. Когда `A0-DEPLOY` решится — добавить
  `on.schedule` в `ci.yml` + шаг `node scripts/apply-d1-overlay.mjs --remote`
  перед `build`, повторного одобрения не требуется.
- Фаза 3: Worker Cron для re-scan (по образцу `A1-RETENTION`).
- Секреты: DataForSEO в env (не в репо); пароль требует сброса после возврата депозита
  (R10). Будущие: CF API token, Anthropic, Resend, Stripe — в GitHub/Worker secrets.
- TBD: вынос AccessAtlas в отдельный репозиторий (упростит Pages-интеграцию и защитит
  от путаницы с detnav в `main`) — решение владельца.
