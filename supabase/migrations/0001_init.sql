-- Кэш каталога Rebrickable (пишет только сервер service-ролью, читают все)
create table public.sets_cache (
  set_num text primary key,
  name text not null,
  year int not null,
  theme_id int not null,
  num_parts int not null default 0,
  num_minifigs int not null default 0,
  img_url text,
  fetched_at timestamptz not null default now()
);
alter table public.sets_cache enable row level security;
create policy "sets_cache public read" on public.sets_cache
  for select using (true);

create table public.themes_cache (
  id int primary key,
  parent_id int,
  name text not null,
  fetched_at timestamptz not null default now()
);
alter table public.themes_cache enable row level security;
create policy "themes_cache public read" on public.themes_cache
  for select using (true);

-- Коллекции пользователей
create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_num text not null references public.sets_cache(set_num),
  status text not null check (status in ('owned', 'wishlist')),
  added_at timestamptz not null default now(),
  unique (user_id, set_num)
);
alter table public.collection_items enable row level security;
create policy "collection owner select" on public.collection_items
  for select using (auth.uid() = user_id);
create policy "collection owner insert" on public.collection_items
  for insert with check (auth.uid() = user_id);
create policy "collection owner update" on public.collection_items
  for update using (auth.uid() = user_id);
create policy "collection owner delete" on public.collection_items
  for delete using (auth.uid() = user_id);
create index collection_items_user_idx on public.collection_items (user_id, status);

-- Шаринг: слаг — секрет, поэтому таблица закрыта (только владелец),
-- а публичное чтение идёт через security definer функцию по точному слагу.
create table public.shares (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique,
  created_at timestamptz not null default now()
);
alter table public.shares enable row level security;
create policy "shares owner all" on public.shares
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.collection_by_slug(p_slug text)
returns table (set_num text, status text, added_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select ci.set_num, ci.status, ci.added_at
  from public.shares s
  join public.collection_items ci on ci.user_id = s.user_id
  where s.slug = p_slug;
$$;
revoke all on function public.collection_by_slug(text) from public;
grant execute on function public.collection_by_slug(text) to anon, authenticated;
