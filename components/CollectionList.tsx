import Link from "next/link";
import SetActions from "@/components/SetActions";
import type { Entry } from "@/lib/stats";
import type { RbTheme } from "@/lib/rebrickable";
import { rootThemeName } from "@/lib/themes";
import { bareSetNum } from "@/lib/links";

export default function CollectionList({ entries, themes, editable }:
  { entries: Entry[]; themes: RbTheme[]; editable: boolean }) {
  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = rootThemeName(e.set.theme_id, themes);
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(e);
  }
  return (
    <>
      {[...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([franchise, list]) => (
        <section key={franchise}>
          <h2>{franchise}</h2>
          <ul className="mine-list">
            {list.map(({ set, status }) => (
              <li key={set.set_num} className="card mine-item">
                {set.img_url && <img src={set.img_url} alt={set.name} loading="lazy" />}
                <div>
                  <Link href={`/set/${set.set_num}`} className="set-card-name">{set.name}</Link>
                  <div className="muted">{bareSetNum(set.set_num)} · {set.year} · {set.num_parts} дет.</div>
                </div>
                {editable && <SetActions setNum={set.set_num} initialStatus={status} isAuthed />}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
