# The Ledger (v3)

A personal expense, income, debt, and recurring-payment tracker with real multi-user accounts.
Free to run: **Supabase** (auth + database) + **Vercel** (hosting).

---

## Updating from an earlier version

Your Supabase project already has tables from before. Run migrations **in order**, skipping any you've already applied:

1. `supabase/migration_v2.sql` — adds payment method, yearly recurring, and the `income` table
2. `supabase/migration_v3.sql` — adds the `user_settings` table (Profile preferences)

Open Supabase → **SQL Editor** → **New query**, paste each file's contents, click **Run**. Nothing you've already entered is touched.

Starting completely fresh? Just run `supabase/schema.sql` once — it creates everything.

## Setup

1. Copy `.env.example` to `.env.local`, fill in your Supabase Project URL + anon key.
2. `npm install`
3. `npm run dev`

## What's new in v3

- **Notes now show on the Dashboard** — not just in All Entries.
- **Profile tab** — account info (email, member since), sign out, and preferences:
  - Toggle manual date & time entry when logging a spend. Off by default (auto-stamped); when off, the date/time fields don't even appear on the Add Spend form.
  - Choose how many recent spends the Dashboard shows (1–20).
  - Preferences are saved per-account and apply everywhere you log in.
- **Navigable Insights** — step backward through past weeks or months (◂ ▸) instead of only seeing the current one. "All Time" has no navigation, since there's nothing to step through.
- **Income by Source chart** — a second pie chart next to the spending-by-category one, so you can see where money's coming from, not just where it's going, for the selected period.

## What's in v2 (still here)

Yearly recurring payments, payment method (cash/digital) on every expense, automatic Cash/Digital/Total balance, debt settlement that auto-creates the matching expense or income entry, and CSV export from All Entries.

## How multi-user data isolation works

Every table has a `user_id` column, and Supabase Row Level Security policies mean the database itself refuses to return or modify a row unless it belongs to the signed-in user — enforced server-side, not just hidden in the UI.

## Mobile

The layout is fully fluid — stat cards, forms, and charts collapse to fewer columns as the screen narrows, and the tab bar scrolls horizontally on phones. It's built mobile-first-friendly rather than as a separate app; works in a phone browser (portrait or landscape) without a native install. If you want a home-screen icon, most phone browsers offer "Add to Home Screen" once it's deployed to a real URL.

## Project structure

```
src/
  supabaseClient.js
  Auth.jsx
  App.jsx
  Ledger.jsx                  — tab shell
  lib/
    helpers.js                 — formatting, date ranges, CSV export
    useLedgerData.js            — Supabase reads/writes, derived stats, settings
  pages/
    Dashboard.jsx, AddSpend.jsx, Income.jsx, Debts.jsx, Recurring.jsx, Entries.jsx, Profile.jsx
  components/
    UI.jsx                       — shared row/stat/panel building blocks
supabase/
  schema.sql                  — fresh install
  migration_v2.sql            — v1 → v2 upgrade
  migration_v3.sql            — v2 → v3 upgrade
```

## Ideas for later

- Per-category monthly budgets with an over-budget warning
- Search across all entries
- Light/dark theme toggle
- A day-before reminder for recurring payments (Supabase Edge Functions, still free tier)

## Costs

Supabase and Vercel free tiers comfortably cover personal or small-group use.

