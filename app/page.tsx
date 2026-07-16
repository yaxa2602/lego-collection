import Link from "next/link";
import SetCard from "@/components/SetCard";
import { searchSets, getThemesCached } from "@/lib/rebrickable";
import { buildThemeTree } from "@/lib/themes";

export const dynamic = "force-dynamic";

type Search = { q?: string; franchise?: string; sub?: string; sort?: string; page?: string };

export default async function Catalog({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const franchiseId = Number(sp.franchise) || undefined;
  const subId = Number(sp.sub) || undefined;

  let themes: Awaited<ReturnType<typeof getThemesCached>> = [];
  let result: { count: number; sets: Awaited<ReturnType<typeof searchSets>>["sets"] } | null = null;
  let failed = false;
  try {
    themes = await getThemesCached();
    // Rebrickable's theme_id param accepts только ОДИН id — список через запятую даёт 400.
    // Поэтому без descendantIds: sub, иначе franchise, иначе без фильтра по теме.
    const themeIds = subId ? [subId] : franchiseId ? [franchiseId] : undefined;
    result = await searchSets({ search: sp.q, themeIds, ordering: sp.sort, page });
  } catch {
    failed = true;
  }

  const tree = buildThemeTree(themes);
  const franchise = tree.find((t) => t.id === franchiseId);
  const totalPages = result ? Math.ceil(result.count / 24) : 0;
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set("q", sp.q);
    if (sp.franchise) u.set("franchise", sp.franchise);
    if (sp.sub) u.set("sub", sp.sub);
    if (sp.sort) u.set("sort", sp.sort);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <main className="container">
      <form className="filters" method="get" action="/">
        <input className="input" type="search" name="q" placeholder="Название или номер набора" defaultValue={sp.q ?? ""} />
        <select className="input" name="franchise" defaultValue={sp.franchise ?? ""}>
          <option value="">Все франшизы</option>
          {tree.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="input" name="sub" defaultValue={sp.sub ?? ""}>
          <option value="">Все подколлекции</option>
          {franchise?.children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" name="sort" defaultValue={sp.sort ?? "-year"}>
          <option value="-year">Сначала новые</option>
          <option value="year">Сначала старые</option>
          <option value="name">По названию</option>
          <option value="-num_parts">По числу деталей</option>
        </select>
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
          <p className="muted">Найдено наборов: {result.count}</p>
          <ul className="grid">
            {result.sets.map((s) => <SetCard key={s.set_num} set={s} />)}
          </ul>
          {totalPages > 1 && (
            <nav className="pager">
              {page > 1 && <Link className="btn" href={qs(page - 1)}>← Назад</Link>}
              <span className="muted">Стр. {page} из {totalPages}</span>
              {page < totalPages && <Link className="btn" href={qs(page + 1)}>Вперёд →</Link>}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
