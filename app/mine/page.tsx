import Link from "next/link";
import { redirect } from "next/navigation";
import CollectionList from "@/components/CollectionList";
import StatsPanel from "@/components/StatsPanel";
import ShareButton from "@/components/ShareButton";
import { createServerSupabase } from "@/lib/supabase/server";
import { getThemesCached, type CachedSet } from "@/lib/rebrickable";
import type { Entry } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function Mine({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const active: "owned" | "wishlist" = tab === "wishlist" ? "wishlist" : "owned";

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: items } = await supabase
    .from("collection_items").select("set_num, status").order("added_at", { ascending: false });
  const setNums = (items ?? []).map((i) => i.set_num);
  const { data: sets } = setNums.length
    ? await supabase.from("sets_cache").select("*").in("set_num", setNums)
    : { data: [] as CachedSet[] };
  const bySetNum = new Map((sets ?? []).map((s) => [s.set_num, s as CachedSet]));
  const entries: Entry[] = (items ?? [])
    .filter((i) => bySetNum.has(i.set_num))
    .map((i) => ({ set: bySetNum.get(i.set_num)!, status: i.status as Entry["status"] }));

  const themes = await getThemesCached().catch(() => []);
  const shown = entries.filter((e) => e.status === active);

  return (
    <main className="container">
      <div className="page-head">
        <h1>Моя коллекция</h1>
        <ShareButton />
      </div>
      <nav className="tabs">
        <Link className={active === "owned" ? "btn btn-primary" : "btn"} href="/mine">Есть</Link>
        <Link className={active === "wishlist" ? "btn btn-primary" : "btn"} href="/mine?tab=wishlist">Вишлист</Link>
      </nav>
      {shown.length === 0 ? (
        <p className="muted">
          Пока пусто. <Link href="/">Найти первый набор →</Link>
        </p>
      ) : (
        <>
          {active === "owned" && <StatsPanel entries={shown} themes={themes} />}
          <CollectionList entries={shown} themes={themes} editable />
        </>
      )}
    </main>
  );
}
