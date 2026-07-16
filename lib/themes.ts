import type { RbTheme } from "./rebrickable";

export type ThemeNode = RbTheme & { children: ThemeNode[] };

export function buildThemeTree(themes: RbTheme[]): ThemeNode[] {
  const nodes = new Map<number, ThemeNode>(
    themes.map((t) => [t.id, { ...t, children: [] }])
  );
  const roots: ThemeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parent_id != null ? nodes.get(node.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const byName = (a: ThemeNode, b: ThemeNode) => a.name.localeCompare(b.name);
  const sortDeep = (list: ThemeNode[]) => {
    list.sort(byName);
    list.forEach((n) => sortDeep(n.children));
  };
  sortDeep(roots);
  return roots;
}

export function descendantIds(rootId: number, themes: RbTheme[]): number[] {
  const ids = [rootId];
  for (let i = 0; i < ids.length; i++) {
    for (const t of themes) if (t.parent_id === ids[i]) ids.push(t.id);
  }
  return ids;
}

function chainToRoot(themeId: number, themes: RbTheme[]): RbTheme[] {
  const byId = new Map(themes.map((t) => [t.id, t]));
  const chain: RbTheme[] = [];
  let cur = byId.get(themeId);
  while (cur) {
    chain.unshift(cur);
    cur = cur.parent_id != null ? byId.get(cur.parent_id) : undefined;
  }
  return chain;
}

export function rootThemeName(themeId: number, themes: RbTheme[]): string {
  return chainToRoot(themeId, themes)[0]?.name ?? "Другое";
}

export function themePath(themeId: number, themes: RbTheme[]): string {
  const chain = chainToRoot(themeId, themes);
  return chain.length ? chain.map((t) => t.name).join(" → ") : "Другое";
}
