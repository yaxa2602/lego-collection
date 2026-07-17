import type { Entry } from "@/lib/stats";
import type { RbTheme } from "@/lib/rebrickable";
import { totals, groupByFranchise, groupByYear, estimateUsd } from "@/lib/stats";

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
  const usd = estimateUsd(entries);
  return (
    <>
      <section className="stats">
        <div className="card stats-card totals">
          <div><b>{t.sets}</b><span className="muted">наборов</span></div>
          <div><b>{t.parts.toLocaleString("ru-RU")}</b><span className="muted">деталей</span></div>
          <div><b>{t.minifigs}</b><span className="muted">минифигурок</span></div>
          <div><b>≈&nbsp;${usd.toLocaleString("ru-RU")}</b><span className="muted">оценка стоимости</span></div>
        </div>
        <Bars title="По франшизам" items={groupByFranchise(entries, themes)} />
        <Bars title="По годам" items={groupByYear(entries)} />
      </section>
      <p className="stats-note">Стоимость — грубая прикидка из расчёта ~$0,11 за деталь, не реальная цена.</p>
    </>
  );
}
