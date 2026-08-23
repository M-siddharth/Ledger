-- Run this in Supabase: SQL Editor > New query > paste all > Run
-- Safe on your existing project — only adds a new table, nothing else changes.

create table if not exists user_settings (
  user_id uuid primary key references auth.users on delete cascade default auth.uid(),
  manual_datetime boolean not null default false,
  recent_spends_count int not null default 5,
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;

drop policy if exists "own settings" on user_settings;
create policy "own settings" on user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
