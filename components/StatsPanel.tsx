import type { Entry } from "@/lib/stats";
import type { RbTheme } from "@/lib/rebrickable";
import { totals, groupByFranchise, groupByYear } from "@/lib/stats";

function Bars({ title, items }: { title: string; items: { label: string; count: number }[] }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="card stats-card">
      <h3>{title}</h3>
      {items.map((i) => (
        <div key={i.label} className="bar-row">
          <span className="bar-label">{i.label}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(i.count / max) * 100}%` }} />
          </span>
          <span className="bar-count">{i.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsPanel({ entries, themes }: { entries: Entry[]; themes: RbTheme[] }) {
  const t = totals(entries);
  return (
    <section className="stats">
      <div className="card stats-card totals">
        <div><b>{t.sets}</b><span className="muted">наборов</span></div>
        <div><b>{t.parts.toLocaleString("ru-RU")}</b><span className="muted">деталей</span></div>
        <div><b>{t.minifigs}</b><span className="muted">минифигурок</span></div>
      </div>
      <Bars title="По франшизам" items={groupByFranchise(entries, themes)} />
      <Bars title="По годам" items={groupByYear(entries)} />
    </section>
  );
}
