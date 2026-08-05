# Домен: devops

Обновлено: 2026-08-05 · Владелец: devops-engineer

- CI: `.github/workflows/ci.yml` на ветке. **Сейчас гарантированно красный**: вызывает
  `npm run lint:upl`, `npm run lint:minimize`, `node scripts/check-links.mjs` — ни одного
  из них нет в `package.json`/`scripts/`. `package-lock.json` отсутствовал в репо вообще
  (без него `npm ci` не работает) — добавлен 2026-08-05 (commit `e0c9a85`). Узел `A0-CI-FIX`
  (ready): либо написать 3 недостающих скрипта, либо убрать шаги из `ci.yml` — решение
  записать в DECISIONS.md, блокирует A0-DEPLOY. Ветка проекта — `accessatlas`.
- Деплой: НЕ настроен. План (A0-DEPLOY): Cloudflare Pages, прод-ветка `accessatlas`,
  build command `npm run build`, output `dist/`, конвенция `dist/404.html` уже соблюдена.
- Фаза 2+: ежедневный ребилд по cron (GitHub Actions) — подхват D1-оверлеев
  (claims/featured). Фаза 3: Worker Cron для re-scan.
- Секреты: DataForSEO в env (не в репо); пароль требует сброса после возврата депозита
  (R10). Будущие: CF API token, Anthropic, Resend, Stripe — в GitHub/Worker secrets.
- TBD: вынос AccessAtlas в отдельный репозиторий (упростит Pages-интеграцию и защитит
  от путаницы с detnav в `main`) — решение владельца.
