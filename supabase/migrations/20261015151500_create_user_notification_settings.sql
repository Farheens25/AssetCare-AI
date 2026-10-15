create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  warranty_expiry_reminders boolean not null default true,
  maintenance_reminders boolean not null default true,
  product_updates boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

grant select, insert, update on public.user_settings to authenticated;

create policy "Users can read own settings"
  on public.user_settings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own settings"
  on public.user_settings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own settings"
  on public.user_settings
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
