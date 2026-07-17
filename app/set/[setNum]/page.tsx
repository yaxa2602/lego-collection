import { notFound } from "next/navigation";
import SetActions from "@/components/SetActions";
import SetCard from "@/components/SetCard";
import { getSetCached, getThemesCached, searchSets, type CachedSet } from "@/lib/rebrickable";
import { themePath } from "@/lib/themes";
import { instructionsUrl, bricklinkUrl, avitoUrl, bareSetNum } from "@/lib/links";
import { createServerSupabase } from "@/lib/supabase/server";

type Status = "owned" | "wishlist" | null;

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

  // Статусы всех наборов пользователя — для текущего набора, меток и фильтра серии.
  const statusOf = new Map<string, Status>();
  if (user) {
    const { data } = await supabase.from("collection_items").select("set_num,status");
    for (const r of data ?? []) statusOf.set(r.set_num as string, r.status as Status);
  }
  const status = statusOf.get(set.set_num) ?? null;

  // «Соберите серию»: другие наборы этой же темы, которых у пользователя ещё нет.
  const themeName = themes.find((t) => t.id === set.theme_id)?.name;
  let series: CachedSet[] = [];
  try {
    const r = await searchSets({ themeIds: [set.theme_id], ordering: "-year" });
    series = r.sets
      .filter((s) => s.set_num !== set.set_num && statusOf.get(s.set_num) !== "owned")
      .slice(0, 8);
  } catch { /* API недоступен — секцию просто не показываем */ }

  return (
    <main className="container">
      <div className="set-page">
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
        <SetActions setNum={set.set_num} setName={set.name} initialStatus={status} isAuthed={!!user} withHint />
        <h2 className="section-title">Где купить и как собрать</h2>
        <p className="section-note">Набор мог сняться с продажи — вот где найти его и инструкцию:</p>
        <ul className="ext-links">
          <li>
            <a href={instructionsUrl(set.set_num)} target="_blank" rel="noopener">
              <span className="ext-ic">📖</span>
              <span><b>Инструкция по сборке</b><small>Официальный PDF на lego.com</small></span>
            </a>
          </li>
          <li>
            <a href={bricklinkUrl(set.set_num)} target="_blank" rel="noopener">
              <span className="ext-ic">🧱</span>
              <span><b>Купить на BrickLink</b><small>Мировой маркетплейс наборов и деталей, с ценами</small></span>
            </a>
          </li>
          <li>
            <a href={avitoUrl(set.set_num, set.name)} target="_blank" rel="noopener">
              <span className="ext-ic">🔎</span>
              <span><b>Найти на Avito</b><small>Объявления б/у в России</small></span>
            </a>
          </li>
        </ul>
      </div>
      </div>

      {series.length > 0 && (
        <section className="series">
          <h2 className="section-title">Соберите серию</h2>
          <p className="section-note">
            Другие наборы{themeName ? ` серии «${themeName}»` : " этой темы"}, которых у вас ещё нет.
          </p>
          <ul className="grid">
            {series.map((s) => (
              <SetCard key={s.set_num} set={s} status={statusOf.get(s.set_num) ?? null} isAuthed={!!user} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
