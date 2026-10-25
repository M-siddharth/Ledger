-- Ledger v4 additive migration. Existing records are preserved.
create table if not exists public.balance_adjustments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 amount numeric(14,2) not null check (amount <> 0), method text not null check (method in ('cash','digital')),
 reason text not null, occurred_on date not null default current_date, created_at timestamptz not null default now()
);
create table if not exists public.balance_transfers (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 amount numeric(14,2) not null check (amount > 0), from_method text not null check (from_method in ('cash','digital')),
 to_method text not null check (to_method in ('cash','digital')), notes text, created_at timestamptz not null default now(),
 check (from_method <> to_method)
);
create table if not exists public.budgets (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 category text not null, amount numeric(14,2) not null check (amount > 0), month_start date not null,
 created_at timestamptz not null default now(), unique(user_id,category,month_start)
);
create table if not exists public.savings_goals (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, target_amount numeric(14,2) not null check (target_amount > 0),
 current_amount numeric(14,2) not null default 0 check (current_amount >= 0), target_date date,
 created_at timestamptz not null default now()
);
create table if not exists public.custom_categories (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, archived boolean not null default false, created_at timestamptz not null default now(),
 unique(user_id,name)
);
create table if not exists public.custom_payment_methods (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, account_method text not null check (account_method in ('cash','digital')),
 archived boolean not null default false, created_at timestamptz not null default now(),
 unique(user_id,name)
);
do $$ declare t text; begin
 foreach t in array array['balance_adjustments','balance_transfers','budgets','savings_goals','custom_categories','custom_payment_methods'] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('drop policy if exists "Users manage own rows" on public.%I', t);
  execute format('create policy "Users manage own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
 end loop;
end $$;
create or replace function public.ledger_transfer(p_amount numeric, p_from_method text, p_to_method text, p_notes text default null)
returns uuid language plpgsql security invoker set search_path = public as $$
declare transfer_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_amount is null or p_amount <= 0 then raise exception 'Transfer amount must be positive'; end if;
 if p_from_method not in ('cash','digital') or p_to_method not in ('cash','digital') or p_from_method = p_to_method then
  raise exception 'Choose two different balance accounts';
 end if;
 insert into public.balance_transfers(user_id,amount,from_method,to_method,notes)
 values(auth.uid(),round(p_amount,2),p_from_method,p_to_method,p_notes) returning id into transfer_id;
 return transfer_id;
end; $$;
grant execute on function public.ledger_transfer(numeric,text,text,text) to authenticated;
