import { notFound } from "next/navigation";
import SetActions from "@/components/SetActions";
import { getSetCached, getThemesCached } from "@/lib/rebrickable";
import { themePath } from "@/lib/themes";
import { instructionsUrl, bricklinkUrl, avitoUrl, bareSetNum } from "@/lib/links";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SET_NUM_PATTERN = /^[A-Za-z0-9.]+(-\d+)?$/;

export async function generateMetadata({ params }: { params: Promise<{ setNum: string }> }) {
  const { setNum } = await params;
  const set = await getSetCached(setNum).catch(() => null);
  return { title: set ? `${set.name} — Коллекция LEGO` : "Коллекция LEGO" };
}

export default async function SetPage({ params }: { params: Promise<{ setNum: string }> }) {
  const { setNum } = await params;
  if (!SET_NUM_PATTERN.test(setNum)) notFound();
  const set = await getSetCached(setNum);
  if (!set) notFound();

  const themes = await getThemesCached().catch(() => []);
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  let status: "owned" | "wishlist" | null = null;
  if (user) {
    const { data } = await supabase.from("collection_items")
      .select("status").eq("set_num", setNum).maybeSingle();
    status = (data?.status as typeof status) ?? null;
  }

  return (
    <main className="container set-page">
      <div className="card set-hero">
        {set.img_url && <img src={set.img_url} alt={set.name} />}
      </div>
      <div>
        <h1 className="set-title">{set.name}</h1>
        <p className="set-crumb">{themePath(set.theme_id, themes)}</p>
        <dl className="set-facts">
          <div><dt>Номер</dt><dd>{bareSetNum(set.set_num)}</dd></div>
          <div><dt>Год выпуска</dt><dd>{set.year}</dd></div>
          <div><dt>Деталей</dt><dd>{set.num_parts}</dd></div>
          <div><dt>Минифигурок</dt><dd>{set.num_minifigs}</dd></div>
        </dl>
        <SetActions setNum={set.set_num} initialStatus={status} isAuthed={!!user} />
        <h2 className="section-title">Купить и собрать</h2>
        <ul className="ext-links">
          <li><a href={instructionsUrl(set.set_num)} target="_blank" rel="noopener">📖 Инструкция</a></li>
          <li><a href={bricklinkUrl(set.set_num)} target="_blank" rel="noopener">🧱 BrickLink</a></li>
          <li><a href={avitoUrl(set.set_num, set.name)} target="_blank" rel="noopener">🔎 Avito</a></li>
        </ul>
      </div>
    </main>
  );
}
