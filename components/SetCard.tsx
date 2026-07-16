import Link from "next/link";
import type { CachedSet } from "@/lib/rebrickable";

export default function SetCard({ set }: { set: CachedSet }) {
  return (
    <li className="card set-card">
      <Link href={`/set/${set.set_num}`}>
        {set.img_url ? (
          <img src={set.img_url} alt={set.name} loading="lazy" />
        ) : (
          <div className="set-noimg">🧱</div>
        )}
        <div className="set-card-body">
          <div className="set-card-name">{set.name}</div>
          <div className="muted">
            {set.set_num.replace(/-1$/, "")} · {set.year} · {set.num_parts} дет.
          </div>
        </div>
      </Link>
    </li>
  );
}
