-- num_minifigs: null = «ещё не запрашивали», считается только при просмотре набора
alter table public.sets_cache alter column num_minifigs drop not null;
alter table public.sets_cache alter column num_minifigs drop default;
update public.sets_cache set num_minifigs = null;
