-- A2-STRIPE-CHECKOUT: платный анлок PDF-плана (€19.99, разовая оплата через
-- Stripe Checkout). См. docs/project/INTERFACES.md §3-4. scan_id — PK: анлок
-- привязан к КОНКРЕТНОМУ скану (план per-scan), один анлок на скан. Повторная
-- оплата того же скана (или повтор вебхука Stripe — доставка at-least-once)
-- обновляет строку через ON CONFLICT, не плодит вторую (recordPlanPurchase в
-- worker/lib/db.js — идемпотентно). stripe_ref — checkout session id, для
-- сверки/возвратов, не для чтения в рантайме (тот же смысл, что featured.stripe_ref).
-- paid_at — ISO-время ОБРАБОТКИ подтверждённого подписью вебхука на сервере,
-- НЕ из данных Stripe/клиента (тот же принцип, что computeFeaturedUntil): анлок
-- ставится только по проверенному событию, никогда по ответу success_url.
CREATE TABLE IF NOT EXISTS plan_purchases (
  scan_id TEXT PRIMARY KEY,
  stripe_ref TEXT,
  paid_at TEXT NOT NULL
);
