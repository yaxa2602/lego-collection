"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { buyLinks } from "@/lib/links";

// Окно после добавления набора: для вишлиста — сразу варианты «где купить»,
// для коллекции — переход к своим наборам.
// Рендерим через портал в <body>, чтобы окно не было потомком карточки
// (иначе transform карточки при :hover ломает position:fixed и окно мерцает).
export default function AddedDialog({ kind, setNum, setName, onClose }:
  { kind: "owned" | "wishlist"; setNum: string; setName: string; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="popup-backdrop" onClick={onClose}>
      <div className="popup" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="popup-x" onClick={onClose} aria-label="Закрыть">×</button>
        {kind === "owned" ? (
          <>
            <div className="popup-emoji">🎉</div>
            <p className="popup-title">Набор в вашей коллекции!</p>
            <p className="popup-text">Посмотреть все свои наборы и статистику?</p>
            <Link className="btn btn-primary popup-cta" href="/mine">Смотреть коллекцию →</Link>
          </>
        ) : (
          <>
            <div className="popup-emoji">⭐</div>
            <p className="popup-title">Добавлено в вишлист!</p>
            <p className="popup-text">Где найти и купить этот набор:</p>
            <div className="popup-links">
              {buyLinks(setNum, setName).map((l, i) => (
                <a key={l.id} className={i === 0 ? "buy-row buy-row-hi" : "buy-row"} href={l.url} target="_blank" rel="noopener">
                  <span className="ext-ic">{l.icon}</span>
                  <span><b>{l.title}</b><small>{l.note}</small></span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
