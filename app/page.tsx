import Link from "next/link";
import SetCard from "@/components/SetCard";
import ThemeFilter from "@/components/ThemeFilter";
import { searchSets, getThemesCached } from "@/lib/rebrickable";
import { buildThemeTree } from "@/lib/themes";
import { createServerSupabase } from "@/lib/supabase/server";
import { retailMinYear } from "@/lib/availability";

export const dynamic = "force-dynamic";

type Search = { q?: string; franchise?: string; sub?: string; sort?: string; page?: string; retail?: string };
type Status = "owned" | "wishlist" | null;

// Номера страниц для пагинатора: 1 … вокруг текущей … последняя.
function pageWindow(cur: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  if (cur > 4) out.push("…");
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) out.push(p);
  if (cur < total - 3) out.push("…");
  out.push(total);
  return out;
}

export default async function Catalog({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Math.max(1, Math.trunc(Number(sp.page)) || 1);
  const franchiseId = Number(sp.franchise) || undefined;
  const subId = Number(sp.sub) || undefined;
  const onlyRetail = sp.retail === "1";

  let themes: Awaited<ReturnType<typeof getThemesCached>> = [];
  let result: { count: number; sets: Awaited<ReturnType<typeof searchSets>>["sets"] } | null = null;
  let failed = false;
  try {
    themes = await getThemesCached();
    // Rebrickable's theme_id принимает только ОДИН id — список через запятую даёт 400.
    const themeIds = subId ? [subId] : franchiseId ? [franchiseId] : undefined;
    result = await searchSets({
      search: sp.q, themeIds, ordering: sp.sort, page,
      minYear: onlyRetail ? retailMinYear() : undefined,
    });
  } catch {
    failed = true;
  }

  // Статусы наборов текущего пользователя — одним запросом, для кнопок на карточках.
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const statusOf = new Map<string, Status>();
  if (user && result) {
    const { data } = await supabase.from("collection_items").select("set_num,status");
    for (const r of data ?? []) statusOf.set(r.set_num as string, r.status as Status);
  }

  // Франшизы для фильтра: корневые темы (дедуп по имени на всякий случай),
  // с их прямыми подколлекциями. Порядок уже алфавитный из buildThemeTree.
  const seen = new Set<string>();
  const franchises = buildThemeTree(themes)
    .filter((t) => !seen.has(t.name) && seen.add(t.name))
    .map((t) => ({ id: t.id, name: t.name, subs: t.children.map((c) => ({ id: c.id, name: c.name })) }));

  const totalPages = result ? Math.ceil(result.count / 24) : 0;
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set("q", sp.q);
    if (sp.franchise) u.set("franchise", sp.franchise);
    if (sp.sub) u.set("sub", sp.sub);
    if (sp.sort) u.set("sort", sp.sort);
    if (onlyRetail) u.set("retail", "1");
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <main className="container">
      <section className="hero">
        <h1>Каталог <span className="accent">LEGO</span></h1>
        <p>Найди наборы, отметь «есть» или «хочу» и собери свою статистику.</p>
      </section>

      <form className="filters" method="get" action="/">
        <input className="input search" type="search" name="q" placeholder="Название или номер набора" defaultValue={sp.q ?? ""} />
        <ThemeFilter franchises={franchises} initialFranchise={sp.franchise} initialSub={sp.sub} />
        <select className="input" name="sort" defaultValue={sp.sort ?? "-year"}>
          <option value="-year">Сначала новые</option>
          <option value="year">Сначала старые</option>
          <option value="name">По названию</option>
          <option value="-num_parts">По числу деталей</option>
        </select>
        <label className="check" title={`Наборы ${retailMinYear()} года и новее — они, скорее всего, ещё продаются`}>
          <input type="checkbox" name="retail" value="1" defaultChecked={onlyRetail} />
          Только в продаже
        </label>
        <button className="btn btn-primary" type="submit">Найти</button>
      </form>

      {failed && (
        <p className="error">Каталог временно недоступен — попробуйте обновить страницу.</p>
      )}
      {result && result.count === 0 && (
        <p className="muted">Ничего не нашлось. Попробуйте номер вида «42151» или другое название.</p>
      )}
      {result && result.count > 0 && (
        <>
          <p className="result-count">Найдено наборов: {result.count}</p>
          <ul className="grid">
            {result.sets.map((s) => (
              <SetCard key={s.set_num} set={s} status={statusOf.get(s.set_num) ?? null} isAuthed={!!user} />
            ))}
          </ul>
          {totalPages > 1 && (
            <nav className="pager" aria-label="Страницы">
              {page > 1 && <Link className="pg" href={qs(page - 1)} aria-label="Предыдущая">←</Link>}
              {pageWindow(page, totalPages).map((p, i) =>
                p === "…"
                  ? <span key={`g${i}`} className="pg-gap">…</span>
                  : <Link key={p} className={p === page ? "pg pg-current" : "pg"} href={qs(p)}>{p}</Link>
              )}
              {page < totalPages && <Link className="pg" href={qs(page + 1)} aria-label="Следующая">→</Link>}
              <form className="pager-jump" method="get" action="/">
                {sp.q && <input type="hidden" name="q" value={sp.q} />}
                {sp.franchise && <input type="hidden" name="franchise" value={sp.franchise} />}
                {sp.sub && <input type="hidden" name="sub" value={sp.sub} />}
                {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
                {onlyRetail && <input type="hidden" name="retail" value="1" />}
                <input className="input" type="number" name="page" min={1} max={totalPages} placeholder={`№`} aria-label="Перейти к странице" />
                <button className="btn" type="submit">Перейти</button>
              </form>
            </nav>
          )}
        </>
      )}
    </main>
  );
}
