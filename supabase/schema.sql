-- For a BRAND NEW Supabase project only.
-- If you already ran the old schema.sql, use migration_v2.sql instead.

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  amount numeric not null,
  place text not null,
  category text not null,
  paid boolean not null default true,
  method text check (method in ('cash','digital')),
  notes text,
  is_debt_payment boolean not null default false,
  debt_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  person text not null,
  amount numeric not null,
  direction text not null check (direction in ('i_owe', 'owed_to_me')),
  due_date date,
  notes text,
  settled boolean not null default false,
  settled_method text check (settled_method in ('cash','digital')),
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table expenses add constraint expenses_debt_id_fkey
  foreign key (debt_id) references debts(id) on delete set null;

create table if not exists recurring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  amount numeric not null,
  frequency text not null check (frequency in ('monthly', 'weekly', 'yearly')),
  due_day int not null,
  due_month int,
  category text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  source text not null,
  amount numeric not null,
  method text not null check (method in ('cash','digital')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists user_settings (
  user_id uuid primary key references auth.users on delete cascade default auth.uid(),
  manual_datetime boolean not null default false,
  recent_spends_count int not null default 5,
  updated_at timestamptz not null default now()
);

alter table expenses enable row level security;
alter table debts enable row level security;
alter table recurring enable row level security;
alter table income enable row level security;
alter table user_settings enable row level security;

create policy "own expenses" on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own debts" on debts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own recurring" on recurring for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own income" on income for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own settings" on user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
