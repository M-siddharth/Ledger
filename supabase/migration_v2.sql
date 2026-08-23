-- Run this in Supabase: SQL Editor > New query > paste all > Run
-- Safe to run on your EXISTING project — it only adds new things, nothing is deleted.

-- 1. Expenses: track payment method, and link to a debt if this expense
--    was auto-created by settling a debt.
alter table expenses add column if not exists method text check (method in ('cash','digital'));
alter table expenses add column if not exists is_debt_payment boolean not null default false;
alter table expenses add column if not exists debt_id uuid references debts(id) on delete set null;

-- 2. Debts: record how (and when) a debt was settled.
alter table debts add column if not exists settled_method text check (settled_method in ('cash','digital'));
alter table debts add column if not exists settled_at timestamptz;

-- 3. Recurring: allow "yearly" frequency, and a month field for it.
alter table recurring drop constraint if exists recurring_frequency_check;
alter table recurring add constraint recurring_frequency_check check (frequency in ('monthly','weekly','yearly'));
alter table recurring add column if not exists due_month int;

-- 4. New table: income (salary, cash gifts, etc.)
create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  source text not null,
  amount numeric not null,
  method text not null check (method in ('cash','digital')),
  notes text,
  created_at timestamptz not null default now()
);

alter table income enable row level security;

drop policy if exists "own income" on income;
create policy "own income" on income
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
