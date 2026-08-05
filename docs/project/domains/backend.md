# Домен: backend

Обновлено: 2026-08-05 · Владелец: backend-engineer

Ничего не построено — домен открывается в Фазе 1.

- Целевая схема: единый Cloudflare Worker (`worker/`), эндпоинты и типы —
  INTERFACES.md §2–4; архитектура сканера — domains/architecture.md.
- Решения: axe-core + Browser Rendering (D-004), Claude Haiku + KV-кэш (D-005).
- Секреты: Anthropic API key, Resend, Stripe — только в Worker secrets, не в репо.
- Анти-абьюз: Turnstile + KV rate-limit (IP+домен), ≤6 страниц/скан, троттлинг,
  user-agent с контактной ссылкой.
- TBD: выбор Queues vs прямой вызов при нагрузке; retention сканов (GDPR, R6).
