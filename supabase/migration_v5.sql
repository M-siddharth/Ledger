-- Ledger v5: permanent per-user audit history.
-- Run after migration_v4.sql in the same Supabase project.
-- Existing ledger data is not modified. New audit records are created for future changes.

create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('created','updated','deleted')),
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default now()
);

alter table public.activity_log enable row level security;
drop policy if exists "Users read own activity" on public.activity_log;
create policy "Users read own activity" on public.activity_log
  for select to authenticated using (auth.uid() = user_id);
grant select on public.activity_log to authenticated;

create or replace function public.ledger_audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_json jsonb;
  new_json jsonb;
  row_user_id uuid;
  row_id text;
begin
  if tg_op = 'INSERT' then
    new_json := to_jsonb(new);
    row_user_id := (new_json ->> 'user_id')::uuid;
    row_id := coalesce(new_json ->> 'id', new_json ->> 'user_id');
    insert into public.activity_log(user_id, table_name, record_id, action, new_data)
    values(row_user_id, tg_table_name, row_id, 'created', new_json);
    return new;
  elsif tg_op = 'UPDATE' then
    old_json := to_jsonb(old);
    new_json := to_jsonb(new);
    row_user_id := coalesce((new_json ->> 'user_id')::uuid, (old_json ->> 'user_id')::uuid);
    row_id := coalesce(new_json ->> 'id', old_json ->> 'id');
    if old_json is distinct from new_json then
      insert into public.activity_log(user_id, table_name, record_id, action, old_data, new_data)
      values(row_user_id, tg_table_name, row_id, 'updated', old_json, new_json);
    end if;
    return new;
  else
    old_json := to_jsonb(old);
    row_user_id := (old_json ->> 'user_id')::uuid;
    row_id := old_json ->> 'id';
    insert into public.activity_log(user_id, table_name, record_id, action, old_data)
    values(row_user_id, tg_table_name, row_id, 'deleted', old_json);
    return old;
  end if;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'expenses','income','debts','recurring','balance_adjustments',
    'balance_transfers','budgets','savings_goals',
    'custom_categories','custom_payment_methods','user_settings'
  ] loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('drop trigger if exists ledger_audit_changes on public.%I', t);
      execute format(
        'create trigger ledger_audit_changes after insert or update or delete on public.%I for each row execute function public.ledger_audit_row_change()',
        t
      );
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
