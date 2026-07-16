import { describe, it, expect } from "vitest";
import { buildSetsQuery, mapSet, type RbSet } from "./rebrickable";

describe("buildSetsQuery", () => {
  it("собирает параметры поиска, тем и сортировки", () => {
    const q = buildSetsQuery({ search: "bugatti", themeIds: [5, 37], ordering: "-year", page: 2 });
    expect(q.get("search")).toBe("bugatti");
    expect(q.get("theme_id")).toBe("5,37");
    expect(q.get("ordering")).toBe("-year");
    expect(q.get("page")).toBe("2");
    expect(q.get("page_size")).toBe("24");
  });
  it("отбрасывает неизвестный ordering и пустые параметры", () => {
    const q = buildSetsQuery({ ordering: "evil;drop table" });
    expect(q.get("ordering")).toBe("-year");
    expect(q.get("search")).toBeNull();
    expect(q.get("theme_id")).toBeNull();
    expect(q.get("page")).toBeNull();
  });
});

describe("mapSet", () => {
  it("маппит ответ API в CachedSet", () => {
    const raw: RbSet = {
      set_num: "42151-1", name: "Bugatti Bolide", year: 2023,
      theme_id: 1, num_parts: 905, set_img_url: "https://img/x.jpg",
    };
    expect(mapSet(raw, 0)).toEqual({
      set_num: "42151-1", name: "Bugatti Bolide", year: 2023,
      theme_id: 1, num_parts: 905, num_minifigs: 0, img_url: "https://img/x.jpg",
    });
  });
});
