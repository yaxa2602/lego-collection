import { describe, it, expect } from "vitest";
import { buildThemeTree, descendantIds, rootThemeName, themePath } from "./themes";
import type { RbTheme } from "./rebrickable";

const T: RbTheme[] = [
  { id: 1, parent_id: null, name: "Technic" },
  { id: 5, parent_id: null, name: "Star Wars" },
  { id: 51, parent_id: 5, name: "UCS" },
  { id: 511, parent_id: 51, name: "Rebuilds" },
];

describe("themes", () => {
  it("строит дерево: корни по алфавиту, дети вложены", () => {
    const tree = buildThemeTree(T);
    expect(tree.map((t) => t.name)).toEqual(["Star Wars", "Technic"]);
    expect(tree[0].children[0].name).toBe("UCS");
    expect(tree[0].children[0].children[0].name).toBe("Rebuilds");
  });
  it("descendantIds включает корень и всех потомков", () => {
    expect(descendantIds(5, T).sort()).toEqual([5, 51, 511].sort());
    expect(descendantIds(1, T)).toEqual([1]);
  });
  it("rootThemeName поднимается к корню", () => {
    expect(rootThemeName(511, T)).toBe("Star Wars");
    expect(rootThemeName(1, T)).toBe("Technic");
    expect(rootThemeName(999, T)).toBe("Другое");
  });
  it("themePath собирает путь через стрелку", () => {
    expect(themePath(51, T)).toBe("Star Wars → UCS");
    expect(themePath(1, T)).toBe("Technic");
  });
});
