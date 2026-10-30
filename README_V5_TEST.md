# The Ledger — v5 test branch

This is a React + Vite web app. It runs in your laptop browser and in an Android Studio Pixel emulator browser. It is not a native Android Studio project yet.

## Run locally
1. Open this folder in a terminal.
2. Install dependencies: `npm install`
3. Create `.env.local` beside `package.json` with your Supabase project URL and publishable/anon key:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```
4. Start: `npm run dev:emulator`
5. Laptop browser: `http://localhost:5173`
6. Android Studio Pixel emulator Chrome: `http://10.0.2.2:5173`

Never put a Supabase service-role key in this file.

## Database migrations
For an existing Ledger database, first ensure v2 and v3 migrations from the original project were applied. Then run:
1. `supabase/migration_v4.sql` (skip if already applied)
2. `supabase/migration_v5.sql`

Run each complete SQL file in Supabase Dashboard → SQL Editor. These migrations are additive and do not intentionally delete or rewrite existing financial records. V5 starts recording changes from the moment its triggers are installed; it cannot reconstruct earlier history.

## V5 features
- Permanent database-triggered activity log for future creates, edits and deletes.
- Activity screen with action filters and searchable old/new row data.
- Planning: edit/delete balance adjustments, transfers, budgets and savings goals.
- Multiple monthly budgets, category/month selection and spend progress.
- Detailed Insights popup with day/week/month grouping, category/source filters and latest 20 rows.
- Compact mobile responsive styles.

## Important test status
This branch is for testing only. It has not been merged to `main` or deployed. Run `npm run build` locally and test all flows against a non-production/test Supabase project before using real financial records. The activity log is permanent for normal app operations; do not manually delete audit rows.
