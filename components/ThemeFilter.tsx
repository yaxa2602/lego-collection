"use client";

import { useMemo, useRef, useState } from "react";

type Sub = { id: number; name: string };
type Franchise = { id: number; name: string; subs: Sub[] };

// Фильтр тем: франшиза — поле с поиском (комбобокс по 150 темам),
// подколлекции — обычный список, появляется сразу при выборе франшизы.
export default function ThemeFilter({ franchises, initialFranchise, initialSub }:
  { franchises: Franchise[]; initialFranchise?: string; initialSub?: string }) {
  const initial = franchises.find((f) => String(f.id) === initialFranchise);
  const [frId, setFrId] = useState(initialFranchise ?? "");
  const [query, setQuery] = useState(initial?.name ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [sub, setSub] = useState(initialSub ?? "");
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subs = franchises.find((f) => String(f.id) === frId)?.subs ?? [];
  const selectedName = franchises.find((f) => String(f.id) === frId)?.name ?? "";

  // Список опций: "Все франшизы" + отфильтрованные по подстроке (если печатают новое).
  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = !q || q === selectedName.toLowerCase()
      ? franchises
      : franchises.filter((f) => f.name.toLowerCase().includes(q));
    return [{ id: 0, name: "Все франшизы", subs: [] as Sub[] }, ...base];
  }, [query, selectedName, franchises]);

  function choose(f: { id: number; name: string }) {
    const id = f.id === 0 ? "" : String(f.id);
    setFrId(id);
    setQuery(f.id === 0 ? "" : f.name);
    setSub("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, options.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { if (open) { e.preventDefault(); choose(options[active]); } }
    else if (e.key === "Escape") { setOpen(false); setQuery(selectedName); }
  }

  return (
    <>
      <input type="hidden" name="franchise" value={frId} />
      <div className="combo">
        <input
          className="input"
          type="text"
          placeholder="Все франшизы"
          value={query}
          role="combobox"
          aria-expanded={open}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => { setOpen(true); setActive(0); }}
          onBlur={() => { blurTimer.current = setTimeout(() => { setOpen(false); setQuery(selectedName); }, 120); }}
          onKeyDown={onKeyDown}
        />
        {open && (
          <ul
            className="combo-list"
            // не даём полю потерять фокус при клике по варианту —
            // иначе blur закрывает список раньше, чем сработает клик (первый клик «пустой»)
            onMouseDown={(e) => e.preventDefault()}
          >
            {options.length === 1 ? (
              <li className="combo-empty">Ничего не найдено</li>
            ) : (
              options.map((f, i) => (
                <li
                  key={f.id}
                  className={i === active ? "combo-opt active" : "combo-opt"}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(f)}
                >
                  {f.name}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      <select
        className="input" name="sub" value={sub}
        onChange={(e) => setSub(e.target.value)}
        disabled={subs.length === 0}
      >
        <option value="">{subs.length ? "Все подколлекции" : "Нет подколлекций"}</option>
        {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </>
  );
}
