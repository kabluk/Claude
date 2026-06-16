# MenuScan — QR Menu Platform for Restaurants

A SaaS platform that gives restaurants a beautiful digital menu accessible via QR code. Built for the US/EU market.

## What it does

- Restaurant owners create and manage their digital menu in minutes
- Guests scan one QR code — menu opens instantly on any phone
- Owner gets real-time notifications on every scan
- Built-in analytics: which dishes guests browse most
- Orders sent directly to owner via email/push

## Upsell services

- Menu redesign (graphic + structural) — $299-799 one-time
- Full 3D restaurant website — $1499-2499 one-time

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Shadcn/ui
- **Database:** Supabase (Postgres + Auth + Storage)
- **Payments:** Stripe
- **Email:** Resend
- **Analytics:** PostHog
- **Hosting:** Vercel

## Project Structure

```
/app
  /api          → API routes (orders, webhooks, qr)
  /(auth)       → Login, register pages
  /(dashboard)  → Owner dashboard
  /menu/[slug]  → Public menu page (guest-facing)
/components
  /ui           → Shadcn base components
  /menu         → Menu editor components
  /dashboard    → Dashboard components
/lib
  /supabase     → Supabase client
  /stripe       → Stripe helpers
  /email        → Resend email templates
/types          → TypeScript types
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Pricing

| Plan | Price | Restaurants | Features |
|---|---|---|---|
| Starter | $29/mo | 1 | Menu + QR + basic analytics |
| Growth | $59/mo | 5 | + dish analytics + seasonal menus |
| Pro | $99/mo | unlimited | + AI assistant + PDF import + multilingual |
