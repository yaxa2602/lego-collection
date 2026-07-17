"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Status = "owned" | "wishlist" | null;

export default function SetActions({ setNum, initialStatus, isAuthed, withHint = false }:
  { setNum: string; initialStatus: Status; isAuthed: boolean; withHint?: boolean }) {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popup, setPopup] = useState<Status>(null);

  function scrollToBuy() {
    setPopup(null);
    document.getElementById("buy-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const avito = document.getElementById("buy-avito");
    if (avito) {
      avito.classList.add("blink");
      setTimeout(() => avito.classList.remove("blink"), 1300);
    }
  }

  async function setTo(next: Status) {
    if (!isAuthed) { router.push("/login"); return; }

    try {
      setBusy(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const res = next === null
        ? await supabase.from("collection_items").delete().eq("user_id", user.id).eq("set_num", setNum)
        : await supabase.from("collection_items").upsert(
            { user_id: user.id, set_num: setNum, status: next },
            { onConflict: "user_id,set_num" }
          );
      if (res.error) setError("Не получилось сохранить, попробуйте ещё раз.");
      else { setStatus(next); if (withHint && next) setPopup(next); }
    } catch {
      setError("Не получилось сохранить, попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
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
      </div>
      {error && <p className="error">{error}</p>}
      {withHint && status && (
        <p className="action-hint">
          {status === "owned" ? "Набор в вашей коллекции. " : "Набор в вашем вишлисте. "}
          <Link href={status === "owned" ? "/mine" : "/mine?tab=wishlist"}>
            Открыть {status === "owned" ? "коллекцию" : "вишлист"} →
          </Link>
        </p>
      )}

      {popup && (
        <div className="popup-backdrop" onClick={() => setPopup(null)}>
          <div className="popup" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="popup-x" onClick={() => setPopup(null)} aria-label="Закрыть">×</button>
            {popup === "owned" ? (
              <>
                <div className="popup-emoji">🎉</div>
                <p className="popup-title">Набор в вашей коллекции!</p>
                <p className="popup-text">Посмотреть все свои наборы и статистику?</p>
                <Link className="btn btn-primary" href="/mine">Смотреть коллекцию →</Link>
              </>
            ) : (
              <>
                <div className="popup-emoji">⭐</div>
                <p className="popup-title">Добавлено в вишлист!</p>
                <p className="popup-text">Показать, где найти и купить этот набор?</p>
                <button className="btn btn-primary" onClick={scrollToBuy}>Где купить →</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
