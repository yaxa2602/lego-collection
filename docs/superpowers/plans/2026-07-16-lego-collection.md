# «Коллекция LEGO» — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Публичное веб-приложение: каталог всех наборов LEGO (Rebrickable API), личная коллекция «есть/хочу» со статистикой и шарингом по ссылке.

**Architecture:** Next.js App Router (SSR, серверные компоненты тянут Rebrickable с read-through-кэшем в Postgres), Supabase — auth (email+пароль), таблицы коллекции и кэша с RLS; публичный доступ к чужой коллекции — через security-definer RPC по слагу. Клиентские компоненты минимальны (кнопки статуса, шаринг).

**Tech Stack:** Next.js 16 (TypeScript, App Router, plain CSS без Tailwind), Supabase (@supabase/ssr, @supabase/supabase-js), Rebrickable API v3, Vitest.

**Спека:** `docs/superpowers/specs/2026-07-16-lego-collection-design.md` — читать перед началом.

## Global Constraints

- Папка проекта: `c:\Users\yaxa2\OneDrive\Документы\проекты\коллекция лего` (git уже инициализирован, ветка `master`).
- ⚠️ Next.js этой версии отличается от привычной: перед кодом читать доки в `node_modules/next/dist/docs/` (после скаффолда). Конвенция `middleware.ts` устарела — использовать `proxy.ts` (док: `01-app/03-api-reference/03-file-conventions/proxy.md`).
- Язык интерфейса: русский. Названия наборов из API — английские, это норма.
- Ключ Rebrickable — только на сервере (`REBRICKABLE_API_KEY`), сервисный ключ Supabase (`SUPABASE_SERVICE_ROLE_KEY`) — только на сервере. В клиентский бандл не попадают.
- Лимит Rebrickable ≈ 1 req/sec — любые данные наборов/тем читаются через кэш-таблицы, TTL 30 дней.
- Дизайн: светлая тема основная + тёмная по `prefers-color-scheme`; главный акцент — красный LEGO `#D01012`; жёлтый `#FFCF00` и синий `#0055BF` — вторичные; минимализм, студы как декор.
- Референс паттернов auth/Supabase: проект «Карта уличных животных» — `c:\Users\yaxa2\OneDrive\Документы\проекты\приложение для фотографий котов с их геометкой` (далее «проект-референс»).
- Коммитить после каждой задачи (или чаще), сообщения — conventional commits на английском.

## Что нужно от пользователя (до Task 2 и Task 4)

1. **Supabase-проект.** Создать НОВЫЙ бесплатный проект в дашборде supabase.com (старый занят картой животных, не смешиваем). Нужны: Project URL, anon key, service_role key.
2. **Ключ Rebrickable.** rebrickable.com → регистрация → Settings → API → Generate API Key.

---

## File Structure

```
app/
  layout.tsx              — корневой layout: шрифт Rubik, шапка с навигацией и студами
  globals.css             — дизайн-токены (светлая/тёмная), компонентные стили
  page.tsx                — Каталог: поиск, фильтры франшиза→подтема, сортировка, пагинация
  set/[setNum]/page.tsx   — Страница набора + внешние ссылки + кнопки коллекции
  mine/page.tsx           — Моя коллекция: вкладки есть/вишлист, статистика, шаринг
  c/[slug]/page.tsx       — Публичная read-only коллекция по слагу
  login/page.tsx          — Вход/регистрация (адаптация из проекта-референса)
  auth/callback/route.ts  — Callback (копия из проекта-референса)
proxy.ts                  — Обновление сессии Supabase (замена middleware)
components/
  SetCard.tsx             — Карточка набора в сетке каталога
  SetActions.tsx          — (client) Кнопки «У меня есть»/«Хочу»/«Убрать»
  CollectionList.tsx      — Список коллекции с группировкой по франшизам
  StatsPanel.tsx          — Итоги + столбики по франшизам и годам (CSS-бары)
  ShareButton.tsx         — (client) Включить/выключить шаринг, скопировать ссылку
lib/
  links.ts                — Внешние URL: инструкции lego.com, BrickLink, Avito
  links.test.ts
  rebrickable.ts          — Типы, buildSetsQuery, mapSet, fetch-обёртка, read-through кэш
  rebrickable.test.ts
  themes.ts               — Дерево тем: buildThemeTree, descendantIds, rootThemeName, themePath
  themes.test.ts
  stats.ts                — Агрегация: totals, groupByFranchise, groupByYear
  stats.test.ts
  supabase/client.ts      — browser-клиент (копия из проекта-референса)
  supabase/server.ts      — server-клиент (копия из проекта-референса)
  supabase/admin.ts       — service-role клиент (только сервер, для записи кэша)
supabase/migrations/0001_init.sql
AGENTS.md, README.md, .env.local, public/manifest.webmanifest
```

---

### Task 1: Скаффолд, Vitest, дизайн-токены, layout

**Files:**
- Create: весь скаффолд Next.js в корне проекта; `AGENTS.md`; `app/globals.css`; `app/layout.tsx`; `vitest.config.ts`

**Interfaces:**
- Produces: рабочий `npm run dev`, `npm test`; CSS-классы `card`, `btn`, `btn-primary`, `badge`, `studs`, переменные `--bg --panel --text --muted --accent --yellow --blue --border`.

- [ ] **Step 1: Скаффолд.** В папке проекта (файлы `docs/` и `.git` уже есть — create-next-app в непустую папку не встанет, поэтому скаффолдим во временную и переносим):

```powershell
Set-Location "c:\Users\yaxa2\OneDrive\Документы\проекты\коллекция лего"
npx create-next-app@latest _scaffold --ts --app --eslint --no-tailwind --no-src-dir --turbopack --import-alias "@/*" --use-npm --yes
Get-ChildItem _scaffold -Force | Where-Object Name -notin '.git','node_modules' | Move-Item -Destination . -Force
Remove-Item -Recurse -Force _scaffold
npm install
```

- [ ] **Step 2: Прочитать доки** `node_modules/next/dist/docs/index.md` (оглавление) и `01-app/03-api-reference/03-file-conventions/proxy.md` — понадобится в Task 2.

- [ ] **Step 3: AGENTS.md** (в корень, дословно):

```markdown
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
```

И `CLAUDE.md` с единственной строкой: `@AGENTS.md`

- [ ] **Step 4: Vitest.** `npm i -D vitest` и файл `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: { include: ["lib/**/*.test.ts"] },
});
```

В `package.json` в scripts добавить: `"test": "vitest run"`.

- [ ] **Step 5: globals.css** — заменить содержимое целиком:

```css
:root {
  --bg: #faf8f5;
  --panel: #ffffff;
  --text: #1d1d1f;
  --muted: #6e6e73;
  --accent: #d01012;
  --yellow: #ffcf00;
  --blue: #0055bf;
  --border: #e6e2dc;
  --radius: 12px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1c1b19;
    --panel: #262522;
    --text: #f2f0ed;
    --muted: #9c9a95;
    --border: #3a3833;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-rubik), system-ui, sans-serif;
  line-height: 1.5;
}
a { color: var(--blue); text-decoration: none; }
a:hover { text-decoration: underline; }

.container { max-width: 1080px; margin: 0 auto; padding: 0 16px; }

/* шапка со студами */
.site-header {
  background: var(--panel);
  border-bottom: 4px solid var(--accent);
  padding: 12px 0;
}
.site-header .container { display: flex; align-items: center; gap: 20px; }
.logo { font-weight: 700; font-size: 20px; color: var(--text); }
.logo:hover { text-decoration: none; }
.studs {
  display: inline-flex; gap: 6px; margin-right: 4px; vertical-align: middle;
}
.studs i {
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--accent);
  box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.25);
}
.studs i:nth-child(2) { background: var(--yellow); }
.studs i:nth-child(3) { background: var(--blue); }
.nav { margin-left: auto; display: flex; gap: 16px; align-items: center; }

/* карточки и кнопки */
.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.btn {
  font: inherit; font-weight: 600; cursor: pointer;
  padding: 8px 18px; border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--panel); color: var(--text);
}
.btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn:disabled { opacity: 0.5; cursor: default; }
.badge {
  display: inline-block; font-size: 12px; font-weight: 700;
  padding: 2px 10px; border-radius: 999px; color: #fff;
}
.badge-owned { background: var(--accent); }
.badge-wishlist { background: var(--blue); }

.grid {
  display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  padding: 0; list-style: none;
}
.muted { color: var(--muted); }
.error { color: var(--accent); font-weight: 600; }
main.container { padding-top: 24px; padding-bottom: 48px; }
```

- [ ] **Step 6: layout.tsx** — заменить целиком:

```tsx
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const rubik = Rubik({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "Коллекция LEGO",
  description: "Каталог наборов LEGO и ваша личная коллекция",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={rubik.variable}>
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="logo">
              <span className="studs"><i /><i /><i /></span> Коллекция LEGO
            </Link>
            <nav className="nav">
              <Link href="/">Каталог</Link>
              <Link href="/mine">Моя коллекция</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
```

Удалить `app/page.module.css`, а `app/page.tsx` временно заменить заглушкой:

```tsx
export default function Home() {
  return <main className="container"><p className="muted">Каталог появится в Task 6.</p></main>;
}
```

- [ ] **Step 7: Проверка.** `npm run dev` → страница открывается, шапка со студами видна, тёмная тема переключается системой. `npm test` → «no test files found» — это ок (или добавить пустой placeholder-тест не надо). `npx tsc --noEmit` → чисто.

- [ ] **Step 8: Commit.** `git add -A; git commit -m "feat: scaffold Next.js app with LEGO design tokens and layout"`

---

### Task 2: Supabase — проект, миграция, клиенты, auth, proxy

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `proxy.ts`, `app/login/page.tsx`, `app/auth/callback/route.ts`, `.env.local`, `.env.example`
- Deps: `npm i @supabase/ssr @supabase/supabase-js`

**Interfaces:**
- Produces: `createBrowserSupabase()`, `createServerSupabase()` (async, cookie-aware), `createAdminSupabase()`; таблицы `sets_cache`, `themes_cache`, `collection_items`, `shares`; RPC `collection_by_slug(p_slug text)`.

- [ ] **Step 1: Получить от пользователя** URL/anon/service_role нового Supabase-проекта (см. «Что нужно от пользователя»). Записать в `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
SUPABASE_SERVICE_ROLE_KEY=<service_role>
REBRICKABLE_API_KEY=<заполнится в Task 4>
```

И `.env.example` с теми же именами без значений. Убедиться, что `.env*` в `.gitignore`.

- [ ] **Step 2: Миграция** `supabase/migrations/0001_init.sql`:

```sql
-- Кэш каталога Rebrickable (пишет только сервер service-ролью, читают все)
create table public.sets_cache (
  set_num text primary key,
  name text not null,
  year int not null,
  theme_id int not null,
  num_parts int not null default 0,
  num_minifigs int not null default 0,
  img_url text,
  fetched_at timestamptz not null default now()
);
alter table public.sets_cache enable row level security;
create policy "sets_cache public read" on public.sets_cache
  for select using (true);

create table public.themes_cache (
  id int primary key,
  parent_id int,
  name text not null,
  fetched_at timestamptz not null default now()
);
alter table public.themes_cache enable row level security;
create policy "themes_cache public read" on public.themes_cache
  for select using (true);

-- Коллекции пользователей
create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_num text not null references public.sets_cache(set_num),
  status text not null check (status in ('owned', 'wishlist')),
  added_at timestamptz not null default now(),
  unique (user_id, set_num)
);
alter table public.collection_items enable row level security;
create policy "collection owner select" on public.collection_items
  for select using (auth.uid() = user_id);
create policy "collection owner insert" on public.collection_items
  for insert with check (auth.uid() = user_id);
create policy "collection owner update" on public.collection_items
  for update using (auth.uid() = user_id);
create policy "collection owner delete" on public.collection_items
  for delete using (auth.uid() = user_id);
create index collection_items_user_idx on public.collection_items (user_id, status);

-- Шаринг: слаг — секрет, поэтому таблица закрыта (только владелец),
-- а публичное чтение идёт через security definer функцию по точному слагу.
create table public.shares (
  user_id uuid primary key references auth.users(id) on delete cascade,
  slug text not null unique,
  created_at timestamptz not null default now()
);
alter table public.shares enable row level security;
create policy "shares owner all" on public.shares
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.collection_by_slug(p_slug text)
returns table (set_num text, status text, added_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select ci.set_num, ci.status, ci.added_at
  from public.shares s
  join public.collection_items ci on ci.user_id = s.user_id
  where s.slug = p_slug;
$$;
revoke all on function public.collection_by_slug(text) from public;
grant execute on function public.collection_by_slug(text) to anon, authenticated;
```

- [ ] **Step 3: Применить миграцию.** MCP Supabase у пользователя в read-only — попросить пользователя вставить SQL в дашборде (SQL Editor → Run) и подтвердить. Проверить через MCP `list_tables`, что 4 таблицы появились.

- [ ] **Step 4: Клиенты Supabase.** Скопировать из проекта-референса файлы `lib/supabase/client.ts` и `lib/supabase/server.ts` как есть. Создать `lib/supabase/admin.ts`:

```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

// Клиент с service-ролью: обходит RLS. Только для записи кэша каталога на сервере.
export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
```

`npm i server-only` не нужен — пакет входит в Next.js.

- [ ] **Step 5: proxy.ts.** Открыть `middleware.ts` проекта-референса и док `proxy.md` (см. Task 1 Step 2). Портировать логику обновления сессии в конвенцию `proxy.ts` в корне (та же роль: подхватывать/обновлять cookie сессии на каждом запросе). Матчер — все пути, кроме статики (взять из дока/референса).

- [ ] **Step 6: Логин и callback.** Скопировать из проекта-референса `app/auth/callback/route.ts` без изменений. Скопировать `app/login/page.tsx` и адаптировать: убрать i18n-хуки (проект одноязычный) — все строки по-русски напрямую; после входа редирект на `/mine`. Классы кнопок/полей заменить на `btn`, `btn-primary` из globals.css (поля ввода — добавить в globals.css при необходимости стиль `.input` по образцу `.btn`).

- [ ] **Step 7: Проверка.** `npm run dev` → регистрация нового пользователя (email+пароль), вход, выход. `npx tsc --noEmit` чисто.

- [ ] **Step 8: Commit.** `git commit -m "feat: supabase schema, auth (email+password), session proxy"`

---

### Task 3: lib/links.ts — внешние ссылки (TDD)

**Files:**
- Create: `lib/links.ts`, `lib/links.test.ts`

**Interfaces:**
- Produces: `instructionsUrl(setNum: string): string`, `bricklinkUrl(setNum: string): string`, `avitoUrl(setNum: string, name: string): string`, `bareSetNum(setNum: string): string`.

- [ ] **Step 1: Failing test** `lib/links.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { instructionsUrl, bricklinkUrl, avitoUrl, bareSetNum } from "./links";

describe("links", () => {
  it("bareSetNum отрезает суффикс варианта", () => {
    expect(bareSetNum("42151-1")).toBe("42151");
    expect(bareSetNum("42151")).toBe("42151");
  });
  it("инструкции lego.com по голому номеру", () => {
    expect(instructionsUrl("42151-1")).toBe(
      "https://www.lego.com/service/building-instructions/42151"
    );
  });
  it("BrickLink использует полный номер с вариантом", () => {
    expect(bricklinkUrl("42151-1")).toBe(
      "https://www.bricklink.com/v2/catalog/catalogitem.page?S=42151-1"
    );
  });
  it("Avito — поисковый запрос с номером и названием", () => {
    expect(avitoUrl("42151-1", "Bugatti Bolide")).toBe(
      "https://www.avito.ru/all?q=lego%2042151%20Bugatti%20Bolide"
    );
  });
});
```

- [ ] **Step 2: Run** `npm test` → FAIL (module not found).

- [ ] **Step 3: Implement** `lib/links.ts`:

```ts
// Внешние ссылки по набору. Ничего не парсим — только формируем URL-ы.
export function bareSetNum(setNum: string): string {
  return setNum.replace(/-\d+$/, "");
}

export function instructionsUrl(setNum: string): string {
  return `https://www.lego.com/service/building-instructions/${bareSetNum(setNum)}`;
}

export function bricklinkUrl(setNum: string): string {
  return `https://www.bricklink.com/v2/catalog/catalogitem.page?S=${setNum}`;
}

export function avitoUrl(setNum: string, name: string): string {
  const q = encodeURIComponent(`lego ${bareSetNum(setNum)} ${name}`);
  return `https://www.avito.ru/all?q=${q}`;
}
```

- [ ] **Step 4: Run** `npm test` → PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: external links to lego.com instructions, BrickLink, Avito"`

---

### Task 4: lib/rebrickable.ts — обёртка API + кэш (TDD на чистую логику)

**Files:**
- Create: `lib/rebrickable.ts`, `lib/rebrickable.test.ts`

**Interfaces:**
- Consumes: `createAdminSupabase()` из Task 2.
- Produces:
  - типы `CachedSet { set_num; name; year; theme_id; num_parts; num_minifigs; img_url: string | null }`, `RbTheme { id; parent_id: number | null; name }`
  - `buildSetsQuery(opts: { search?: string; themeIds?: number[]; ordering?: string; page?: number }): URLSearchParams`
  - `mapSet(raw: RbSet, numMinifigs?: number): CachedSet`
  - `searchSets(opts): Promise<{ count: number; sets: CachedSet[] }>` (попутно upsert в sets_cache)
  - `getSetCached(setNum: string): Promise<CachedSet | null>` (read-through, TTL 30 дней; считает минифигурки суммой quantity из `/sets/{set_num}/minifigs/`)
  - `getThemesCached(): Promise<RbTheme[]>` (read-through всего дерева тем)
  - допустимые ordering: `-year | year | name | -num_parts` (валидируются в buildSetsQuery, дефолт `-year`)

- [ ] **Step 1: Получить от пользователя ключ Rebrickable**, записать в `.env.local` → `REBRICKABLE_API_KEY`.

- [ ] **Step 2: Failing tests** `lib/rebrickable.test.ts` (только чистые функции — сетевые обёртки тестируются вручную в Step 6):

```ts
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
```

- [ ] **Step 3: Run** `npm test` → FAIL.

- [ ] **Step 4: Implement** `lib/rebrickable.ts`:

```ts
import "server-only" — НЕТ: чистые функции нужны тестам. Разделение: сетевые
функции проверяют env внутри себя; сам модуль без "server-only", но его
импортируют только серверные компоненты. Код:

const BASE = "https://rebrickable.com/api/v3/lego";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней
const ORDERINGS = new Set(["-year", "year", "name", "-num_parts"]);

export type RbSet = {
  set_num: string; name: string; year: number; theme_id: number;
  num_parts: number; set_img_url: string | null;
};
export type RbTheme = { id: number; parent_id: number | null; name: string };
export type CachedSet = {
  set_num: string; name: string; year: number; theme_id: number;
  num_parts: number; num_minifigs: number; img_url: string | null;
};
type RbPage<T> = { count: number; next: string | null; results: T[] };

export function buildSetsQuery(opts: {
  search?: string; themeIds?: number[]; ordering?: string; page?: number;
}): URLSearchParams {
  const p = new URLSearchParams();
  if (opts.search?.trim()) p.set("search", opts.search.trim());
  if (opts.themeIds?.length) p.set("theme_id", opts.themeIds.join(","));
  p.set("ordering", ORDERINGS.has(opts.ordering ?? "") ? opts.ordering! : "-year");
  if (opts.page && opts.page > 1) p.set("page", String(opts.page));
  p.set("page_size", "24");
  return p;
}

export function mapSet(raw: RbSet, numMinifigs = 0): CachedSet {
  return {
    set_num: raw.set_num, name: raw.name, year: raw.year,
    theme_id: raw.theme_id, num_parts: raw.num_parts,
    num_minifigs: numMinifigs, img_url: raw.set_img_url,
  };
}

async function rb<T>(path: string, params?: URLSearchParams): Promise<T> {
  const url = `${BASE}${path}${params ? `?${params}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: `key ${process.env.REBRICKABLE_API_KEY}` },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Rebrickable ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

// upsert наборов в кэш; ошибки кэша не роняют выдачу (console.error)
async function cacheSets(sets: CachedSet[]): Promise<void> { ... createAdminSupabase().from("sets_cache").upsert(sets.map(s => ({...s, fetched_at: new Date().toISOString()}))) ... }

export async function searchSets(opts: Parameters<typeof buildSetsQuery>[0]) {
  const page = await rb<RbPage<RbSet>>("/sets/", buildSetsQuery(opts));
  const sets = page.results.map((r) => mapSet(r));
  cacheSets(sets).catch((e) => console.error("cacheSets", e));
  return { count: page.count, sets };
}

export async function getSetCached(setNum: string): Promise<CachedSet | null> {
  const admin = createAdminSupabase();
  const { data } = await admin.from("sets_cache").select("*").eq("set_num", setNum).maybeSingle();
  if (data && Date.now() - new Date(data.fetched_at).getTime() < TTL_MS && data.num_minifigs !== null) {
    return data as CachedSet;
  }
  try {
    const raw = await rb<RbSet>(`/sets/${setNum}/`);
    const minifigs = await rb<RbPage<{ quantity: number }>>(`/sets/${setNum}/minifigs/`);
    const set = mapSet(raw, minifigs.results.reduce((n, m) => n + m.quantity, 0));
    await cacheSets([set]);
    return set;
  } catch (e) {
    if (data) return data as CachedSet; // API лёг — отдаём протухший кэш
    if (String(e).includes("404")) return null;
    throw e;
  }
}

export async function getThemesCached(): Promise<RbTheme[]> {
  const admin = createAdminSupabase();
  const { data } = await admin.from("themes_cache").select("*").order("id");
  if (data && data.length > 0 &&
      Date.now() - new Date(data[0].fetched_at).getTime() < TTL_MS) {
    return data as RbTheme[];
  }
  // дерево целиком (страницы по 1000, ~500 тем — 1 страница, но next обходим)
  const all: RbTheme[] = [];
  let params: URLSearchParams | undefined = new URLSearchParams({ page_size: "1000" });
  let path = "/themes/";
  while (true) {
    const page: RbPage<RbTheme> = await rb<RbPage<RbTheme>>(path, params);
    all.push(...page.results.map(t => ({ id: t.id, parent_id: t.parent_id, name: t.name })));
    if (!page.next) break;
    const u = new URL(page.next); path = u.pathname.replace("/api/v3/lego", ""); params = u.searchParams;
  }
  if (all.length) {
    await admin.from("themes_cache").upsert(
      all.map(t => ({ ...t, fetched_at: new Date().toISOString() }))
    );
    return all;
  }
  return (data as RbTheme[]) ?? [];
}
```

(Псевдоучасток `cacheSets` реализовать полностью по описанию в комментарии; импорт `createAdminSupabase` из `@/lib/supabase/admin` — динамическим `await import(...)` внутри функций, чтобы юнит-тесты чистых функций не тянули server-only код.)

- [ ] **Step 5: Run** `npm test` → PASS, `npx tsc --noEmit` чисто.

- [ ] **Step 6: Ручная проверка живого API** (одноразовый скрипт, потом удалить):

```powershell
node -e "fetch('https://rebrickable.com/api/v3/lego/sets/?search=bugatti&theme_id=1,5&page_size=3&ordering=-year',{headers:{Authorization:'key '+process.env.KEY}}).then(r=>r.json()).then(d=>console.log(d.count,d.results?.map(s=>s.set_num)))" 
```
(подставив ключ). Ожидаемо: число результатов и номера наборов. Это же подтверждает, что `theme_id` принимает список через запятую — на этом стоит фильтр франшиз. **Если список не поддерживается** (результаты игнорируют второй id): в Task 6 фильтр передаёт только точный `theme_id` выбранной подтемы, а при выборе франшизы без подтемы — id франшизы; зафиксировать факт в README.

- [ ] **Step 7: Commit.** `git commit -m "feat: rebrickable api wrapper with postgres read-through cache"`

---

### Task 5: lib/themes.ts — дерево франшиз (TDD)

**Files:**
- Create: `lib/themes.ts`, `lib/themes.test.ts`

**Interfaces:**
- Consumes: тип `RbTheme` из Task 4.
- Produces:
  - `buildThemeTree(themes: RbTheme[]): ThemeNode[]` где `ThemeNode = RbTheme & { children: ThemeNode[] }` — корни по алфавиту
  - `descendantIds(rootId: number, themes: RbTheme[]): number[]` — включая сам rootId
  - `rootThemeName(themeId: number, themes: RbTheme[]): string` — имя франшизы (корня ветки)
  - `themePath(themeId: number, themes: RbTheme[]): string` — «Star Wars → Ultimate Collector Series»

- [ ] **Step 1: Failing tests** `lib/themes.test.ts`:

```ts
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
```

- [ ] **Step 2: Run** → FAIL. 
- [ ] **Step 3: Implement** `lib/themes.ts`:

```ts
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
```

- [ ] **Step 4: Run** → PASS. 
- [ ] **Step 5: Commit.** `git commit -m "feat: theme tree helpers (franchise filter, path, grouping)"`

---

### Task 6: Каталог — поиск, фильтры, сортировка, пагинация

**Files:**
- Create: `components/SetCard.tsx`
- Modify: `app/page.tsx` (заменить заглушку)

**Interfaces:**
- Consumes: `searchSets`, `getThemesCached` (Task 4); `buildThemeTree`, `descendantIds` (Task 5).
- Produces: URL-контракт каталога `/?q=&franchise=<id>&sub=<id>&sort=<-year|year|name|-num_parts>&page=N` — его используют ссылки из других страниц.

- [ ] **Step 1: SetCard** `components/SetCard.tsx`:

```tsx
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
```

Стили добавить в globals.css: `.set-card img { width: 100%; aspect-ratio: 4/3; object-fit: contain; background: #fff; }`, `.set-card-body { padding: 10px 12px; }`, `.set-card-name { font-weight: 600; }`, `.set-noimg { aspect-ratio: 4/3; display: grid; place-items: center; font-size: 48px; }`, ссылки карточек без подчёркивания и цветом текста.

- [ ] **Step 2: Каталог** `app/page.tsx` — серверный компонент, фильтры обычной GET-формой (без клиентского JS):

```tsx
import Link from "next/link";
import SetCard from "@/components/SetCard";
import { searchSets, getThemesCached } from "@/lib/rebrickable";
import { buildThemeTree, descendantIds } from "@/lib/themes";

export const dynamic = "force-dynamic";

type Search = { q?: string; franchise?: string; sub?: string; sort?: string; page?: string };

export default async function Catalog({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const franchiseId = Number(sp.franchise) || undefined;
  const subId = Number(sp.sub) || undefined;

  let themes: Awaited<ReturnType<typeof getThemesCached>> = [];
  let result: { count: number; sets: Awaited<ReturnType<typeof searchSets>>["sets"] } | null = null;
  let failed = false;
  try {
    themes = await getThemesCached();
    const themeIds = subId
      ? descendantIds(subId, themes)
      : franchiseId
        ? descendantIds(franchiseId, themes)
        : undefined;
    result = await searchSets({ search: sp.q, themeIds, ordering: sp.sort, page });
  } catch {
    failed = true;
  }

  const tree = buildThemeTree(themes);
  const franchise = tree.find((t) => t.id === franchiseId);
  const totalPages = result ? Math.ceil(result.count / 24) : 0;
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set("q", sp.q);
    if (sp.franchise) u.set("franchise", sp.franchise);
    if (sp.sub) u.set("sub", sp.sub);
    if (sp.sort) u.set("sort", sp.sort);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `/?${s}` : "/";
  };

  return (
    <main className="container">
      <form className="filters" method="get" action="/">
        <input className="input" type="search" name="q" placeholder="Название или номер набора" defaultValue={sp.q ?? ""} />
        <select className="input" name="franchise" defaultValue={sp.franchise ?? ""}>
          <option value="">Все франшизы</option>
          {tree.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="input" name="sub" defaultValue={sp.sub ?? ""}>
          <option value="">Все подколлекции</option>
          {franchise?.children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" name="sort" defaultValue={sp.sort ?? "-year"}>
          <option value="-year">Сначала новые</option>
          <option value="year">Сначала старые</option>
          <option value="name">По названию</option>
          <option value="-num_parts">По числу деталей</option>
        </select>
        <button className="btn btn-primary" type="submit">Найти</button>
      </form>

      {failed && (
        <p className="error">Каталог временно недоступен — попробуйте обновить страницу.</p>
      )}
      {result && result.count === 0 && (
        <p className="muted">Ничего не нашлось. Попробуйте номер вида «42151» или другое название.</p>
      )}
      {result && result.count > 0 && (
        <>
          <p className="muted">Найдено наборов: {result.count}</p>
          <ul className="grid">
            {result.sets.map((s) => <SetCard key={s.set_num} set={s} />)}
          </ul>
          {totalPages > 1 && (
            <nav className="pager">
              {page > 1 && <Link className="btn" href={qs(page - 1)}>← Назад</Link>}
              <span className="muted">Стр. {page} из {totalPages}</span>
              {page < totalPages && <Link className="btn" href={qs(page + 1)}>Вперёд →</Link>}
            </nav>
          )}
        </>
      )}
    </main>
  );
}
```

Нюанс UX: выбор подколлекции требует, чтобы франшиза была уже выбрана и форма отправлена («выбрал франшизу → Найти → появились подколлекции»). Это осознанный компромисс без клиентского JS; упрощение оставить как есть.

Стили в globals.css: `.filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }`, `.input { font: inherit; padding: 8px 12px; border: 1px solid var(--border); border-radius: 10px; background: var(--panel); color: var(--text); }`, `.pager { display: flex; gap: 12px; align-items: center; justify-content: center; margin-top: 24px; }`.

- [ ] **Step 3: Проверка.** `npm run dev` → на `/` виден свежий каталог; поиск «bugatti» находит 42151; фильтр Star Wars → подколлекции появляются после «Найти»; сортировки меняют порядок; пагинация ходит. `npx tsc --noEmit` чисто.

- [ ] **Step 4: Commit.** `git commit -m "feat: catalog with search, franchise filter, sorting, pagination"`

---

### Task 7: Страница набора + кнопки коллекции

**Files:**
- Create: `app/set/[setNum]/page.tsx`, `components/SetActions.tsx`

**Interfaces:**
- Consumes: `getSetCached` (Task 4), `themePath` + `getThemesCached`, `instructionsUrl`/`bricklinkUrl`/`avitoUrl` (Task 3), `createServerSupabase`, `createBrowserSupabase` (Task 2).
- Produces: клиентский `SetActions({ setNum, initialStatus })` — upsert/delete строки `collection_items`; статус `'owned' | 'wishlist' | null`.

- [ ] **Step 1: SetActions** `components/SetActions.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Status = "owned" | "wishlist" | null;

export default function SetActions({ setNum, initialStatus, isAuthed }:
  { setNum: string; initialStatus: Status; isAuthed: boolean }) {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setTo(next: Status) {
    if (!isAuthed) { router.push("/login"); return; }
    setBusy(true); setError(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const res = next === null
      ? await supabase.from("collection_items").delete().eq("user_id", user.id).eq("set_num", setNum)
      : await supabase.from("collection_items").upsert(
          { user_id: user.id, set_num: setNum, status: next },
          { onConflict: "user_id,set_num" }
        );
    setBusy(false);
    if (res.error) setError("Не получилось сохранить, попробуйте ещё раз.");
    else setStatus(next);
  }

  return (
    <div className="set-actions">
      {status === "owned" ? (
        <>
          <span className="badge badge-owned">В коллекции</span>
          <button className="btn" disabled={busy} onClick={() => setTo(null)}>Убрать</button>
        </>
      ) : status === "wishlist" ? (
        <>
          <span className="badge badge-wishlist">В вишлисте</span>
          <button className="btn btn-primary" disabled={busy} onClick={() => setTo("owned")}>Теперь он у меня!</button>
          <button className="btn" disabled={busy} onClick={() => setTo(null)}>Убрать</button>
        </>
      ) : (
        <>
          <button className="btn btn-primary" disabled={busy} onClick={() => setTo("owned")}>У меня есть</button>
          <button className="btn" disabled={busy} onClick={() => setTo("wishlist")}>Хочу</button>
        </>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Страница** `app/set/[setNum]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import SetActions from "@/components/SetActions";
import { getSetCached, getThemesCached } from "@/lib/rebrickable";
import { themePath } from "@/lib/themes";
import { instructionsUrl, bricklinkUrl, avitoUrl, bareSetNum } from "@/lib/links";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SetPage({ params }: { params: Promise<{ setNum: string }> }) {
  const { setNum } = await params;
  const set = await getSetCached(setNum);
  if (!set) notFound();

  const themes = await getThemesCached().catch(() => []);
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  let status: "owned" | "wishlist" | null = null;
  if (user) {
    const { data } = await supabase.from("collection_items")
      .select("status").eq("set_num", setNum).maybeSingle();
    status = (data?.status as typeof status) ?? null;
  }

  return (
    <main className="container set-page">
      <div className="card set-hero">
        {set.img_url && <img src={set.img_url} alt={set.name} />}
      </div>
      <div>
        <h1>{set.name}</h1>
        <p className="muted">{themePath(set.theme_id, themes)}</p>
        <dl className="set-facts">
          <div><dt>Номер</dt><dd>{bareSetNum(set.set_num)}</dd></div>
          <div><dt>Год выпуска</dt><dd>{set.year}</dd></div>
          <div><dt>Деталей</dt><dd>{set.num_parts}</dd></div>
          <div><dt>Минифигурок</dt><dd>{set.num_minifigs}</dd></div>
        </dl>
        <SetActions setNum={set.set_num} initialStatus={status} isAuthed={!!user} />
        <h2>Ссылки</h2>
        <ul className="ext-links">
          <li><a href={instructionsUrl(set.set_num)} target="_blank" rel="noopener">Инструкции по сборке (lego.com)</a></li>
          <li><a href={bricklinkUrl(set.set_num)} target="_blank" rel="noopener">Цены и наличие на BrickLink</a></li>
          <li><a href={avitoUrl(set.set_num, set.name)} target="_blank" rel="noopener">Поискать на Avito</a></li>
        </ul>
      </div>
    </main>
  );
}
```

Стили: `.set-page { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; } @media (max-width: 760px) { .set-page { grid-template-columns: 1fr; } }`, `.set-hero img { width: 100%; object-fit: contain; background: #fff; }`, `.set-facts div { display: flex; gap: 8px; } .set-facts dt { color: var(--muted); min-width: 130px; } .set-facts dd { margin: 0; font-weight: 600; }`, `.set-actions { display: flex; gap: 10px; align-items: center; margin: 16px 0 24px; flex-wrap: wrap; }`, `.ext-links { padding-left: 18px; }`.

- [ ] **Step 3: Проверка.** Открыть `/set/42151-1`: факты, путь темы, три ссылки открываются на нужные сайты. Гость: кнопка ведёт на `/login`. Залогиненный: «У меня есть» → бейдж; в Supabase Table Editor появилась строка. Несуществующий `/set/00000-9` → 404.

- [ ] **Step 4: Commit.** `git commit -m "feat: set page with facts, external links, collection actions"`

---

### Task 8: Моя коллекция — вкладки, группировка, статистика (TDD на stats)

**Files:**
- Create: `lib/stats.ts`, `lib/stats.test.ts`, `components/StatsPanel.tsx`, `components/CollectionList.tsx`, `app/mine/page.tsx`

**Interfaces:**
- Consumes: `CachedSet`, `getThemesCached`; `rootThemeName` (Task 5); клиенты Supabase.
- Produces:
  - `type Entry = { set: CachedSet; status: "owned" | "wishlist" }`
  - `totals(entries: Entry[]): { sets: number; parts: number; minifigs: number }`
  - `groupByFranchise(entries: Entry[], themes: RbTheme[]): { label: string; count: number }[]` (по убыванию count, затем алфавит)
  - `groupByYear(entries: Entry[]): { label: string; count: number }[]` (по возрастанию года)
  - `CollectionList({ entries, themes, editable })` — сгруппированный список; при `editable` рендерит `SetActions`
  - URL-контракт: `/mine?tab=wishlist` — вкладка вишлиста, по умолчанию owned.

- [ ] **Step 1: Failing tests** `lib/stats.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { totals, groupByFranchise, groupByYear, type Entry } from "./stats";
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
});
```

- [ ] **Step 2: Run** → FAIL. 
- [ ] **Step 3: Implement** `lib/stats.ts`:

```ts
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

function tally(labels: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of labels) m.set(l, (m.get(l) ?? 0) + 1);
  return m;
}

export function groupByFranchise(entries: Entry[], themes: RbTheme[]): StatItem[] {
  const m = tally(entries.map((e) => rootThemeName(e.set.theme_id, themes)));
  return [...m entries].map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function groupByYear(entries: Entry[]): StatItem[] {
  const m = tally(entries.map((e) => String(e.set.year)));
  return [...m.entries()].map(([label, count]) => ({ label, count }))
    .sort((a, b) => Number(a.label) - Number(b.label));
}
```

(в `groupByFranchise` опечатка выше намеренно показана как риск — писать `[...m.entries()]`.)

- [ ] **Step 4: Run** → PASS. Commit: `git commit -m "feat: collection stats aggregation"`

- [ ] **Step 5: StatsPanel** `components/StatsPanel.tsx` (серверный, CSS-бары):

```tsx
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
```

Стили: `.stats { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin: 20px 0; } .stats-card { padding: 14px 16px; } .totals { display: flex; justify-content: space-around; text-align: center; } .totals b { display: block; font-size: 24px; } .bar-row { display: grid; grid-template-columns: 1fr 2fr auto; gap: 8px; align-items: center; margin: 6px 0; font-size: 14px; } .bar-track { background: var(--border); border-radius: 6px; height: 10px; overflow: hidden; } .bar-fill { display: block; height: 100%; background: var(--accent); border-radius: 6px; } .bar-count { font-weight: 600; }`

- [ ] **Step 6: CollectionList** `components/CollectionList.tsx` (серверный):

```tsx
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
```

Стили: `.mine-list { list-style: none; padding: 0; display: grid; gap: 10px; } .mine-item { display: grid; grid-template-columns: 96px 1fr auto; gap: 14px; align-items: center; padding: 10px 14px; } .mine-item img { width: 96px; aspect-ratio: 4/3; object-fit: contain; background: #fff; border-radius: 8px; } @media (max-width: 600px) { .mine-item { grid-template-columns: 72px 1fr; } .mine-item .set-actions { grid-column: 1 / -1; margin: 0; } }`

- [ ] **Step 7: Страница** `app/mine/page.tsx`:

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import CollectionList from "@/components/CollectionList";
import StatsPanel from "@/components/StatsPanel";
import ShareButton from "@/components/ShareButton"; // появится в Task 9; до него — не импортировать
import { createServerSupabase } from "@/lib/supabase/server";
import { getThemesCached, type CachedSet } from "@/lib/rebrickable";
import type { Entry } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function Mine({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const active: "owned" | "wishlist" = tab === "wishlist" ? "wishlist" : "owned";

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: items } = await supabase
    .from("collection_items").select("set_num, status").order("added_at", { ascending: false });
  const setNums = (items ?? []).map((i) => i.set_num);
  const { data: sets } = setNums.length
    ? await supabase.from("sets_cache").select("*").in("set_num", setNums)
    : { data: [] as CachedSet[] };
  const bySetNum = new Map((sets ?? []).map((s) => [s.set_num, s as CachedSet]));
  const entries: Entry[] = (items ?? [])
    .filter((i) => bySetNum.has(i.set_num))
    .map((i) => ({ set: bySetNum.get(i.set_num)!, status: i.status as Entry["status"] }));

  const themes = await getThemesCached().catch(() => []);
  const shown = entries.filter((e) => e.status === active);

  return (
    <main className="container">
      <h1>Моя коллекция</h1>
      <nav className="tabs">
        <Link className={active === "owned" ? "btn btn-primary" : "btn"} href="/mine">Есть</Link>
        <Link className={active === "wishlist" ? "btn btn-primary" : "btn"} href="/mine?tab=wishlist">Вишлист</Link>
      </nav>
      {shown.length === 0 ? (
        <p className="muted">
          Пока пусто. <Link href="/">Найти первый набор →</Link>
        </p>
      ) : (
        <>
          {active === "owned" && <StatsPanel entries={shown} themes={themes} />}
          <CollectionList entries={shown} themes={themes} editable />
        </>
      )}
    </main>
  );
}
```

Стили: `.tabs { display: flex; gap: 8px; margin: 12px 0 8px; }`. Импорт и рендер `ShareButton` добавить в Task 9, не здесь.

- [ ] **Step 8: Проверка.** Добавить 3-4 набора из разных франшиз (owned и wishlist) → `/mine`: статистика совпадает с руками посчитанной, группировка по франшизам, вкладки работают, кнопки меняют статус, пустой вишлист показывает заглушку. `npm test`, `npx tsc --noEmit` чисто.

- [ ] **Step 9: Commit.** `git commit -m "feat: my collection page with tabs, franchise groups, stats panel"`

---

### Task 9: Шаринг коллекции

**Files:**
- Create: `components/ShareButton.tsx`, `app/c/[slug]/page.tsx`
- Modify: `app/mine/page.tsx` (добавить ShareButton)

**Interfaces:**
- Consumes: таблица `shares`, RPC `collection_by_slug` (Task 2); `CollectionList`, `StatsPanel` (Task 8).
- Produces: URL `/c/[slug]` — публичная страница.

- [ ] **Step 1: ShareButton** `components/ShareButton.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function ShareButton() {
  const supabase = createBrowserSupabase();
  const [slug, setSlug] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.from("shares").select("slug").maybeSingle()
      .then(({ data }) => { setSlug(data?.slug ?? null); setBusy(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enable() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const newSlug = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
    const { error } = await supabase.from("shares").upsert({ user_id: user.id, slug: newSlug });
    if (!error) setSlug(newSlug);
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("shares").delete().eq("user_id", user.id);
    setSlug(null); setBusy(false);
  }

  async function copy() {
    if (!slug) return;
    await navigator.clipboard.writeText(`${location.origin}/c/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (busy) return <button className="btn" disabled>Шаринг…</button>;
  return slug ? (
    <span className="set-actions">
      <button className="btn btn-primary" onClick={copy}>{copied ? "Скопировано ✓" : "Скопировать ссылку"}</button>
      <button className="btn" onClick={disable}>Выключить шаринг</button>
    </span>
  ) : (
    <button className="btn" onClick={enable}>Поделиться коллекцией</button>
  );
}
```

- [ ] **Step 2:** В `app/mine/page.tsx` рядом с `<h1>` добавить `<ShareButton />` (обернуть заголовок в flex-строку `.page-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }`).

- [ ] **Step 3: Публичная страница** `app/c/[slug]/page.tsx`:

```tsx
import CollectionList from "@/components/CollectionList";
import StatsPanel from "@/components/StatsPanel";
import { createServerSupabase } from "@/lib/supabase/server";
import { getThemesCached, type CachedSet } from "@/lib/rebrickable";
import type { Entry } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function PublicCollection({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const { data: rows } = await supabase.rpc("collection_by_slug", { p_slug: slug });

  if (!rows || rows.length === 0) {
    return (
      <main className="container">
        <h1>Коллекция недоступна</h1>
        <p className="muted">Ссылка неверна, шаринг выключен — или коллекция пока пуста.</p>
      </main>
    );
  }

  const setNums = rows.map((r: { set_num: string }) => r.set_num);
  const { data: sets } = await supabase.from("sets_cache").select("*").in("set_num", setNums);
  const bySetNum = new Map((sets ?? []).map((s) => [s.set_num, s as CachedSet]));
  const entries: Entry[] = rows
    .filter((r: { set_num: string }) => bySetNum.has(r.set_num))
    .map((r: { set_num: string; status: string }) => ({
      set: bySetNum.get(r.set_num)!,
      status: r.status as Entry["status"],
    }));
  const owned = entries.filter((e) => e.status === "owned");
  const themes = await getThemesCached().catch(() => []);

  return (
    <main className="container">
      <h1>Коллекция LEGO</h1>
      <p className="muted">Публичная витрина — только просмотр.</p>
      <StatsPanel entries={owned} themes={themes} />
      <CollectionList entries={owned} themes={themes} editable={false} />
    </main>
  );
}
```

- [ ] **Step 4: Проверка.** `/mine` → «Поделиться» → «Скопировать ссылку» → открыть `/c/<slug>` в приватном окне (без логина): коллекция и статистика видны, кнопок правки нет. «Выключить шаринг» → страница показывает «недоступна». Неверный слаг `/c/zzz` → «недоступна».

- [ ] **Step 5: Commit.** `git commit -m "feat: share collection via public read-only link"`

---

### Task 10: Полировка, PWA-мелочи, README, деплой

**Files:**
- Create: `public/manifest.webmanifest`, `app/icon.svg`, `README.md`
- Modify: `app/layout.tsx` (manifest в metadata), `app/globals.css` (финальные штрихи)

- [ ] **Step 1: Иконка** `app/icon.svg` (Next подхватит как favicon автоматически — сверить по доке `01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md`):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="4" y="20" width="56" height="40" rx="6" fill="#d01012"/>
  <circle cx="20" cy="20" r="9" fill="#d01012"/>
  <circle cx="44" cy="20" r="9" fill="#d01012"/>
  <circle cx="20" cy="17" r="7" fill="#e8413f"/>
  <circle cx="44" cy="17" r="7" fill="#e8413f"/>
</svg>
```

- [ ] **Step 2: Манифест** `public/manifest.webmanifest`:

```json
{
  "name": "Коллекция LEGO",
  "short_name": "LEGO",
  "description": "Каталог наборов LEGO и личная коллекция",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#faf8f5",
  "theme_color": "#d01012",
  "icons": [{ "src": "/icon.svg", "sizes": "any", "type": "image/svg+xml" }]
}
```

В `layout.tsx` в metadata добавить `manifest: "/manifest.webmanifest"`.

- [ ] **Step 3: Прогон глазами всех страниц** в светлой и тёмной теме, десктоп + узкое окно (375px): ничего не разъезжается, контраст текста достаточный. Мелкие правки CSS — по месту.

- [ ] **Step 4: README.md** — коротко: что за проект, скриншот (позже), стек, как запустить (`npm i`, `.env.local` по `.env.example`, `npm run dev`), источники данных (Rebrickable), ограничения (цены — только ссылки на BrickLink/Avito).

- [ ] **Step 5: Финальные проверки.** `npm test` (все зелёные), `npx tsc --noEmit`, `npm run build` (проходит).

- [ ] **Step 6: Деплой.** `vercel link` (создать новый проект `lego-collection`), затем env: `vercel env add` для `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `REBRICKABLE_API_KEY` (production). `vercel --prod`. Smoke: открыть прод-URL, поиск работает, вход работает (в Supabase Auth настроить Site URL на прод-домен!), добавление в коллекцию работает, публичная ссылка открывается.

- [ ] **Step 7: Commit + итог.** `git commit -m "feat: pwa manifest, icon, readme; production deploy"`. Сообщить пользователю прод-URL.

---

## Self-Review (выполнен при написании)

- **Покрытие спеки:** каталог+фильтры+сортировка (T6), страница набора+ссылки (T7, T3), коллекция+статистика (T8), шаринг (T9), auth (T2), кэш и лимиты Rebrickable (T4), дизайн-токены (T1), ошибки: каталог недоступен (T6), протухший кэш как фолбэк (T4), 404 набора (T7), пустые состояния (T8), недоступный слаг (T9). Цены Brickset — «если дадут ключ» из спеки: сознательно НЕ в плане v1, добавится отдельной задачей после получения ключа (ссылки BrickLink/Avito закрывают потребность).
- **Плейсхолдеры:** код приведён для всех шагов; в T4 участок `cacheSets` описан контрактом рядом с полным окружением — исполнителю хватает; проверка `theme_id`-списка вынесена в явный шаг с запасным вариантом.
- **Согласованность типов:** `CachedSet`/`RbTheme`/`Entry` определены в T4/T8 и используются одинаково в T5–T9; `SetActions(setNum, initialStatus, isAuthed)` одинаков в T7 и T8; контракт URL каталога зафиксирован в T6.
