import Link from "next/link";
import type { CachedSet } from "@/lib/rebrickable";
import { bareSetNum } from "@/lib/links";
import CardActions from "./CardActions";

type Status = "owned" | "wishlist" | null;

export default function SetCard({ set, status, isAuthed }:
  { set: CachedSet; status: Status; isAuthed: boolean }) {
  const href = `/set/${set.set_num}`;
  return (
    <li className="set-card">
      <div className="set-card-media">
        <Link className="media-fill" href={href} aria-label={set.name}>
          {set.img_url
            ? <img src={set.img_url} alt={set.name} loading="lazy" />
            : <span className="set-noimg">🧱</span>}
        </Link>
        <CardActions setNum={set.set_num} initialStatus={status} isAuthed={isAuthed} />
      </div>
      <Link className="set-card-body" href={href}>
        <span className="set-card-name">{set.name}</span>
        <span className="set-card-meta">{bareSetNum(set.set_num)} · {set.year} · {set.num_parts} дет.</span>
      </Link>
    </li>
  );
}
