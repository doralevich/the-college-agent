-- Interactive "make your agent perfect" checklist: one row per checked item per student.
-- Unchecking deletes the row, so presence == checked. Writes go through the service-role
-- API route; students can only read their own rows.
create table if not exists public.checklist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  checked_at timestamptz not null default now(),
  primary key (user_id, item_key)
);

alter table public.checklist_items enable row level security;

drop policy if exists "checklist_self_select" on public.checklist_items;
create policy "checklist_self_select" on public.checklist_items
  for select using (auth.uid() = user_id);
