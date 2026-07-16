import CollectionList from "@/components/CollectionList";
import StatsPanel from "@/components/StatsPanel";
import { createServerSupabase } from "@/lib/supabase/server";
import { getThemesCached, type CachedSet } from "@/lib/rebrickable";
import type { Entry } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function PublicCollection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const { data: rows } = await supabase.rpc("collection_by_slug", { p_slug: slug });

  if (!rows || rows.length === 0) {
    return (
      <main className="container">
        <h1>Коллекция недоступна</h1>
        <p className="muted">Ссылка неверна, шаринг выключен — или коллекция пока пуста.</p>
      </main>
    );
  }

  const setNums = rows.map((r: { set_num: string }) => r.set_num);
  const { data: sets } = await supabase.from("sets_cache").select("*").in("set_num", setNums);
  const bySetNum = new Map((sets ?? []).map((s) => [s.set_num, s as CachedSet]));
  const entries: Entry[] = rows
    .filter((r: { set_num: string }) => bySetNum.has(r.set_num))
    .map((r: { set_num: string; status: string }) => ({
      set: bySetNum.get(r.set_num)!,
      status: r.status as Entry["status"],
    }));
  const owned = entries.filter((e) => e.status === "owned");
  const themes = await getThemesCached().catch(() => []);

  return (
    <main className="container">
      <h1>Коллекция LEGO</h1>
      <p className="muted">Публичная витрина — только просмотр.</p>
      <StatsPanel entries={owned} themes={themes} />
      <CollectionList entries={owned} themes={themes} editable={false} />
    </main>
  );
}
