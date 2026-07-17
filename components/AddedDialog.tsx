"use client";

import Link from "next/link";
import { instructionsUrl, bricklinkUrl, avitoUrl } from "@/lib/links";

// Окно после добавления набора: для вишлиста — сразу варианты «где купить»,
// для коллекции — переход к своим наборам.
export default function AddedDialog({ kind, setNum, setName, onClose }:
  { kind: "owned" | "wishlist"; setNum: string; setName: string; onClose: () => void }) {
  return (
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
              <a className="buy-row buy-row-hi" href={avitoUrl(setNum, setName)} target="_blank" rel="noopener">
                <span className="ext-ic">🔎</span>
                <span><b>Найти на Avito</b><small>Объявления б/у в России</small></span>
              </a>
              <a className="buy-row" href={bricklinkUrl(setNum)} target="_blank" rel="noopener">
                <span className="ext-ic">🧱</span>
                <span><b>Купить на BrickLink</b><small>Мировой маркетплейс наборов и деталей</small></span>
              </a>
              <a className="buy-row" href={instructionsUrl(setNum)} target="_blank" rel="noopener">
                <span className="ext-ic">📖</span>
                <span><b>Инструкция по сборке</b><small>Официальный PDF на lego.com</small></span>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
