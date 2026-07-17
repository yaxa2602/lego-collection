import type { CachedSet, RbTheme } from "./rebrickable";
import { rootThemeName } from "./themes";

export type Entry = { set: CachedSet; status: "owned" | "wishlist" };
export type StatItem = { label: string; count: number };

export function totals(entries: Entry[]) {
  return entries.reduce(
    (acc, e) => ({
      sets: acc.sets + 1,
      parts: acc.parts + e.set.num_parts,
      minifigs: acc.minifigs + e.set.num_minifigs,
    }),
    { sets: 0, parts: 0, minifigs: 0 }
  );
}

// Грубая оценка стоимости: средняя розничная цена LEGO ~ $0.11 за деталь.
// Не настоящая цена — только прикидка по числу деталей.
const USD_PER_PART = 0.11;
export function estimateUsd(entries: Entry[]): number {
  const parts = entries.reduce((n, e) => n + e.set.num_parts, 0);
  return Math.round(parts * USD_PER_PART);
}

function tally(labels: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of labels) m.set(l, (m.get(l) ?? 0) + 1);
  return m;
}

export function groupByFranchise(entries: Entry[], themes: RbTheme[]): StatItem[] {
  const m = tally(entries.map((e) => rootThemeName(e.set.theme_id, themes)));
  return [...m.entries()].map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function groupByYear(entries: Entry[]): StatItem[] {
  const m = tally(entries.map((e) => String(e.set.year)));
  return [...m.entries()].map(([label, count]) => ({ label, count }))
    .sort((a, b) => Number(a.label) - Number(b.label));
}
