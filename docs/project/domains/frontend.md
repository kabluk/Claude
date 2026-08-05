# Домен: frontend

Обновлено: 2026-08-05 · Владелец: frontend-engineer

- Стек: React 18 + Vite + `vite-react-ssg` + Tailwind v4. 383 страницы, 14 шаблонов
  в `src/pages/`, маршруты + `getStaticPaths` в `src/routes.tsx`.
- SEO-слой: `src/lib/seo.tsx` (**ORIGIN-заглушка `accessatlas.example` — менять при
  домене вместе со `scripts/gen-a11y-sitemap.mjs`**), JSON-LD 5 типов, порог ≥3.
- Иерархия заголовков проверена скриптом на всех 383 страницах (h1→h3 баг закрыт).
- Клиентские фильтры: `FilterableList.tsx` поверх SSG — без JS список виден целиком.
- Предстоит (Фаза 1): `/scan` лендинг, `/report/:id`, блок матчинга агентств, оценка
  стоимости. Отчёты — noindex, приватная ссылка.
- Отложено: мультиязычный интерфейс (en/de/fr/pl + hreflang) — сейчас EN-only.
