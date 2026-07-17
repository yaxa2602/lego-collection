"use client";

import { useState } from "react";

type Sub = { id: number; name: string };
type Franchise = { id: number; name: string; subs: Sub[] };

// Два связанных выпадающих списка: выбор франшизы сразу подставляет её подколлекции
// (без отправки формы). Без JS деградирует до обычных select'ов с начальными значениями.
export default function ThemeFilter({ franchises, initialFranchise, initialSub }:
  { franchises: Franchise[]; initialFranchise?: string; initialSub?: string }) {
  const [fr, setFr] = useState(initialFranchise ?? "");
  const [sub, setSub] = useState(initialSub ?? "");
  const subs = franchises.find((f) => String(f.id) === fr)?.subs ?? [];

  return (
    <>
      <select
        className="input" name="franchise" value={fr}
        onChange={(e) => { setFr(e.target.value); setSub(""); }}
      >
        <option value="">Все франшизы</option>
        {franchises.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
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
