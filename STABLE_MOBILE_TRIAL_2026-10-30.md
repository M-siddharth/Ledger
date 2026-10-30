# Ledger — Mobile Trial Baseline (2026-10-30)

## Status
**Stable trial baseline / freeze point** for a one-week real-device evaluation, based on the owner's report that the updated app is installed and working on their mobile device.

This designation is a checkpoint, **not** a claim of completed automated tests, full regression coverage, or production certification.

## Source and scope
- Repository: `M-siddharth/Ledger`
- Working branch: `feature/ledger-v4-test`
- Baseline date: 2026-10-30
- Intended trial: approximately one week, then review bugs and usability feedback
- Keep `main` untouched; do not merge or deploy without explicit approval
- Android APK may have been packaged locally; native Android project files and installed APK are not assumed to be committed in this repository.

## Functional scope in this checkpoint
- Income and expense records, balances, and debt tracking
- Cash/digital balance adjustments and transfers
- Monthly budgets, savings goals, and planning record edits/deletions
- Activity history for changes made after the v5 audit migration
- Detailed Insights, filters, and compact mobile UI
- Supabase v4 and v5 migrations as documented in `README_V5_TEST.md`

## Trial checklist
During normal use, note any issues with:
1. Adding/editing/deleting income, expenses, debts, and planning records
2. Cash/digital balances, transfers, and adjustments
3. Recurring entries and monthly budgets
4. Activity history and insights accuracy
5. Mobile layout, keyboard behavior, loading, and sync after reopening
6. Data persistence and any duplicated transactions

For each issue, capture the screen, action taken, expected result, actual result, and approximate time.

## Change control
Treat this checkpoint as the reference for subsequent fixes. Make later changes in separate commits or a new development branch; retain the baseline for comparison. Do not merge into `main` without owner approval.

## Validation limitations
The owner reported the mobile installation works. This note does not verify that the mobile APK exactly matches the current remote source tree, and it does not replace a local `npm run build` or end-to-end testing.
