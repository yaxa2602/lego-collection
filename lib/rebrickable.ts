// Обёртка над Rebrickable API v3 + read-through кэш в Postgres (sets_cache, themes_cache).
// Без "server-only": чистые функции (buildSetsQuery, mapSet) нужны юнит-тестам.
// createAdminSupabase импортируется динамически внутри функций, которым он нужен,
// чтобы импорт этого модуля тестами не тянул server-only код.

const BASE = "https://rebrickable.com/api/v3/lego";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней
const ORDERINGS = new Set(["-year", "year", "name", "-num_parts"]);

export type RbSet = {
  set_num: string; name: string; year: number; theme_id: number;
  num_parts: number; set_img_url: string | null;
};
export type RbTheme = { id: number; parent_id: number | null; name: string };
export type CachedSet = {
  set_num: string; name: string; year: number; theme_id: number;
  num_parts: number; num_minifigs: number; img_url: string | null;
};
type RbPage<T> = { count: number; next: string | null; results: T[] };

export function buildSetsQuery(opts: {
  search?: string; themeIds?: number[]; ordering?: string; page?: number; minYear?: number;
}): URLSearchParams {
  const p = new URLSearchParams();
  if (opts.search?.trim()) p.set("search", opts.search.trim());
  if (opts.themeIds?.length) p.set("theme_id", opts.themeIds.join(","));
  // фильтр по году делает сам Rebrickable — иначе счётчик и пагинация врали бы
  if (opts.minYear) p.set("min_year", String(opts.minYear));
  p.set("ordering", ORDERINGS.has(opts.ordering ?? "") ? opts.ordering! : "-year");
  if (opts.page && opts.page > 1) p.set("page", String(opts.page));
  p.set("page_size", "24");
  return p;
}

export function mapSet(raw: RbSet, numMinifigs = 0): CachedSet {
  return {
    set_num: raw.set_num, name: raw.name, year: raw.year,
    theme_id: raw.theme_id, num_parts: raw.num_parts,
    num_minifigs: numMinifigs, img_url: raw.set_img_url,
  };
}

async function rb<T>(path: string, params?: URLSearchParams): Promise<T> {
  const url = `${BASE}${path}${params ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `key ${process.env.REBRICKABLE_API_KEY}` },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Rebrickable ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

// upsert наборов в кэш; ошибки кэша не роняют выдачу (console.error)
// omitMinifigs: true — вызов из searchSets, где num_minifigs неизвестен;
// колонка не попадает в payload, PostgREST её не трогает при конфликте (новые строки получат null).
async function cacheSets(sets: CachedSet[], opts: { omitMinifigs?: boolean } = {}): Promise<void> {
  const { createAdminSupabase } = await import("@/lib/supabase/admin");
  const admin = createAdminSupabase();
  const rows = sets.map((s) => {
    const { num_minifigs, ...rest } = s;
    const row: Record<string, unknown> = { ...rest, fetched_at: new Date().toISOString() };
    if (!opts.omitMinifigs) row.num_minifigs = num_minifigs;
    return row;
  });
  const { error } = await admin.from("sets_cache").upsert(rows);
  if (error) console.error("cacheSets", error);
}

// сумма quantity по всем страницам /sets/{set_num}/minifigs/ (с ограничением на число страниц)
async function countMinifigs(setNum: string): Promise<number> {
  let total = 0;
  let params: URLSearchParams | undefined;
  let path = `/sets/${setNum}/minifigs/`;
  let pages = 0;
  while (pages < 20) {
    pages++;
    const page = await rb<RbPage<{ quantity: number }>>(path, params);
    total += page.results.reduce((n, m) => n + m.quantity, 0);
    if (!page.next) break;
    const u = new URL(page.next); path = u.pathname.replace("/api/v3/lego", ""); params = u.searchParams;
  }
  return total;
}

export async function searchSets(opts: Parameters<typeof buildSetsQuery>[0]) {
  const page = await rb<RbPage<RbSet>>("/sets/", buildSetsQuery(opts));
  const sets = page.results.map((r) => mapSet(r));
  cacheSets(sets, { omitMinifigs: true }).catch((e) => console.error("cacheSets", e));
  return { count: page.count, sets };
}

export async function getSetCached(setNum: string): Promise<CachedSet | null> {
  const { createAdminSupabase } = await import("@/lib/supabase/admin");
  const admin = createAdminSupabase();
  const { data } = await admin.from("sets_cache").select("*").eq("set_num", setNum).maybeSingle();
  if (data && Date.now() - new Date(data.fetched_at).getTime() < TTL_MS && data.num_minifigs !== null) {
    return { ...(data as CachedSet), num_minifigs: data.num_minifigs ?? 0 };
  }
  try {
    const raw = await rb<RbSet>(`/sets/${setNum}/`);
    const numMinifigs = await countMinifigs(setNum);
    const set = mapSet(raw, numMinifigs);
    // кэш пишем в фоне: сбой кэширования не должен обесценивать успешно полученный набор
    cacheSets([set]).catch((e) => console.error("cacheSets", e));
    return set;
  } catch (e) {
    if (data) return { ...(data as CachedSet), num_minifigs: data.num_minifigs ?? 0 }; // API лёг — отдаём протухший кэш
    if (String(e).includes("404")) return null;
    throw e;
  }
}

export async function getThemesCached(): Promise<RbTheme[]> {
  const { createAdminSupabase } = await import("@/lib/supabase/admin");
  const admin = createAdminSupabase();
  const { data } = await admin.from("themes_cache").select("*").order("id");
  if (data && data.length > 0 &&
      Date.now() - new Date(data[0].fetched_at).getTime() < TTL_MS) {
    return data as RbTheme[];
  }
  try {
    // дерево целиком (страницы по 1000, ~500 тем — 1 страница, но next обходим)
    const all: RbTheme[] = [];
    let params: URLSearchParams | undefined = new URLSearchParams({ page_size: "1000" });
    let path = "/themes/";
    let pages = 0;
    while (pages < 20) {
      pages++;
      const page: RbPage<RbTheme> = await rb<RbPage<RbTheme>>(path, params);
      all.push(...page.results.map(t => ({ id: t.id, parent_id: t.parent_id, name: t.name })));
      if (!page.next) break;
      const u = new URL(page.next); path = u.pathname.replace("/api/v3/lego", ""); params = u.searchParams;
    }
    if (all.length) {
      await admin.from("themes_cache").upsert(
        all.map(t => ({ ...t, fetched_at: new Date().toISOString() }))
      );
      return all;
    }
    return (data as RbTheme[]) ?? [];
  } catch (e) {
    console.error("getThemesCached", e);
    return (data as RbTheme[]) ?? [];
  }
}
