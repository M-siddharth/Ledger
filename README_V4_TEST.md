# Ledger v4 — test branch

This branch is isolated from `main`. Do not merge it until the local test pass is complete.

## Run locally
1. Download this branch ZIP from https://github.com/M-siddharth/Ledger/archive/refs/heads/feature/ledger-v4-test.zip and extract it.
2. Open the extracted folder in a terminal.
3. Run `npm install`, then `npm run dev`.
4. Open the local URL printed by Vite. Existing Supabase environment/configuration is required for sign-in and live data.

## Required database step for v4 planning tools
Before using **Planning** (balance adjustments, transfers, budgets, savings goals), open the Supabase SQL Editor for the project and run the complete `supabase/migration_v4.sql` file. It creates new tables with per-user RLS policies and a database function for atomic transfers. This migration is additive and does not delete existing tables or records. Back up your Supabase data before applying any migration.

## Included in this test pass
- Currency display retains two decimal places.
- Recurring due dates support the actual last day of a month and upcoming list excludes past dates.
- Net debt direction is corrected to receivables minus payables, with gross totals and debt grouping on the dashboard.
- Account icon opens profile/settings.
- Transaction search, category/payment/date filters, edit dialog and delete confirmation.
- Planning page for balance adjustments, cash/digital transfers, monthly category budgets and savings goals.
- Additive Supabase migration for the new planning records.

## Important test limitations
This is a test branch, not a production release. The repository could not be cloned into the isolated build environment, so a local `npm run build` has **not** been run here. The full v4 specification still needs further implementation/verification (notably a complete transaction/debt backup-restore flow, custom label management, stronger atomicity for debt settlement, and editing/deletion workflows for every record type). Do not merge/deploy this branch until these are completed and tested. The `main` branch has not been changed.
