create table if not exists public.maintenance_checklist_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete cascade,
  task_key text not null check (length(task_key) between 1 and 100),
  task_title text not null check (length(trim(task_title)) between 1 and 200),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, asset_id, task_key)
);

create table if not exists public.maintenance_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_id uuid not null references public.assets (id) on delete cascade,
  scheduled_date date not null,
  task_description text not null check (
    length(trim(task_description)) between 1 and 500
  ),
  created_at timestamptz not null default now(),
  unique (user_id, asset_id, scheduled_date, task_description)
);

create index if not exists maintenance_reminders_user_date_idx
  on public.maintenance_reminders (user_id, scheduled_date);

alter table public.maintenance_checklist_items enable row level security;
alter table public.maintenance_reminders enable row level security;

grant select, insert, update, delete
  on public.maintenance_checklist_items to authenticated;
grant select, insert, delete
  on public.maintenance_reminders to authenticated;

create policy "Users can read own maintenance checklist items"
  on public.maintenance_checklist_items
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.assets a
      where a.id = asset_id and a.user_id = (select auth.uid())
    )
  );

create policy "Users can insert own maintenance checklist items"
  on public.maintenance_checklist_items
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.assets a
      where a.id = asset_id and a.user_id = (select auth.uid())
    )
  );

create policy "Users can update own maintenance checklist items"
  on public.maintenance_checklist_items
  for update to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.assets a
      where a.id = asset_id and a.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.assets a
      where a.id = asset_id and a.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own maintenance checklist items"
  on public.maintenance_checklist_items
  for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.assets a
      where a.id = asset_id and a.user_id = (select auth.uid())
    )
  );

create policy "Users can read own maintenance reminders"
  on public.maintenance_reminders
  for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.assets a
      where a.id = asset_id and a.user_id = (select auth.uid())
    )
  );

create policy "Users can insert own maintenance reminders"
  on public.maintenance_reminders
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.assets a
      where a.id = asset_id and a.user_id = (select auth.uid())
    )
  );

create policy "Users can delete own maintenance reminders"
  on public.maintenance_reminders
  for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.assets a
      where a.id = asset_id and a.user_id = (select auth.uid())
    )
  );
