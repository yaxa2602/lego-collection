import { describe, it, expect } from "vitest";
import { totals, groupByFranchise, groupByYear, estimateUsd, type Entry } from "./stats";
import type { CachedSet, RbTheme } from "./rebrickable";

const T: RbTheme[] = [
  { id: 1, parent_id: null, name: "Technic" },
  { id: 5, parent_id: null, name: "Star Wars" },
  { id: 51, parent_id: 5, name: "UCS" },
];
const s = (over: Partial<CachedSet>): CachedSet => ({
  set_num: "1-1", name: "x", year: 2020, theme_id: 1,
  num_parts: 100, num_minifigs: 1, img_url: null, ...over,
});
const E: Entry[] = [
  { set: s({ set_num: "a", theme_id: 1, num_parts: 100, year: 2020 }), status: "owned" },
  { set: s({ set_num: "b", theme_id: 51, num_parts: 200, year: 2021 }), status: "owned" },
  { set: s({ set_num: "c", theme_id: 5, num_parts: 300, year: 2021 }), status: "owned" },
];

describe("stats", () => {
  it("totals суммирует наборы, детали, минифигурки", () => {
    expect(totals(E)).toEqual({ sets: 3, parts: 600, minifigs: 3 });
  });
  it("groupByFranchise поднимает подтемы к франшизе и сортирует по убыванию", () => {
    expect(groupByFranchise(E, T)).toEqual([
      { label: "Star Wars", count: 2 },
      { label: "Technic", count: 1 },
    ]);
  });
  it("groupByYear по возрастанию года", () => {
    expect(groupByYear(E)).toEqual([
      { label: "2020", count: 1 },
      { label: "2021", count: 2 },
    ]);
  });
  it("estimateUsd оценивает по деталям (~$0.11/деталь)", () => {
    expect(estimateUsd(E)).toBe(66); // 600 деталей * 0.11
    expect(estimateUsd([])).toBe(0);
  });
});
