"use client";

import { useEffect, useState } from "react";
import { instructionsUrl, bricklinkUrl, avitoUrl } from "@/lib/links";

type Detail = { setNum: string; setName: string };

// Одно ненавязчивое уведомление на всё приложение: карточки шлют событие,
// оно показывается снизу и само пропадает. Не блокирует клики по каталогу.
export default function Toast() {
  const [item, setItem] = useState<Detail | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function onToast(e: Event) {
      setItem((e as CustomEvent<Detail>).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setItem(null), 7000);
    }
    window.addEventListener("lego-toast", onToast);
    return () => { window.removeEventListener("lego-toast", onToast); clearTimeout(timer); };
  }, []);

  if (!item) return null;

  return (
    <div className="toast" role="status">
      <button className="toast-x" onClick={() => setItem(null)} aria-label="Скрыть">×</button>
      <b className="toast-title">★ Добавлено в вишлист</b>
      <p className="toast-name">{item.setName}</p>
      <div className="toast-links">
        <a href={avitoUrl(item.setNum, item.setName)} target="_blank" rel="noopener">🔎 Avito</a>
        <a href={bricklinkUrl(item.setNum)} target="_blank" rel="noopener">🧱 BrickLink</a>
        <a href={instructionsUrl(item.setNum)} target="_blank" rel="noopener">📖 Инструкция</a>
      </div>
    </div>
  );
}
