"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Status = "owned" | "wishlist" | null;

// Быстрые кнопки прямо на карточке каталога. На мыши выезжают при наведении,
// на тач-экранах видны всегда (CSS). Логика та же, что на странице набора.
export default function CardActions({ setNum, setName, initialStatus, isAuthed }:
  { setNum: string; setName: string; initialStatus: Status; isAuthed: boolean }) {
  const [supabase] = useState(() => createBrowserSupabase());
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [busy, setBusy] = useState(false);

  async function setTo(next: Status) {
    if (!isAuthed) { router.push("/login"); return; }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const res = next === null
        ? await supabase.from("collection_items").delete().eq("user_id", user.id).eq("set_num", setNum)
        : await supabase.from("collection_items").upsert(
            { user_id: user.id, set_num: setNum, status: next },
            { onConflict: "user_id,set_num" }
          );
      if (!res.error) {
        setStatus(next);
        // ненавязчивое уведомление снизу — чтобы можно было отмечать наборы пачкой
        if (next === "wishlist") {
          window.dispatchEvent(new CustomEvent("lego-toast", { detail: { setNum, setName } }));
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {status && (
        <span
          className={`card-mark ${status === "owned" ? "mark-owned" : "mark-wish"}`}
          title={status === "owned" ? "В коллекции" : "В вишлисте"}
        >
          {status === "owned" ? "✓" : "★"}
        </span>
      )}
      <div className="card-actions">
        {status === "owned" ? (
        <button className="ca-btn ca-owned" disabled={busy} onClick={() => setTo(null)} title="Убрать из коллекции">✓ Есть</button>
      ) : status === "wishlist" ? (
        <>
          <button className="ca-btn ca-primary" disabled={busy} onClick={() => setTo("owned")}>Есть</button>
          <button className="ca-btn ca-wish" disabled={busy} onClick={() => setTo(null)} title="Убрать из вишлиста">★ Хочу</button>
        </>
      ) : (
        <>
          <button className="ca-btn ca-primary" disabled={busy} onClick={() => setTo("owned")}>Есть</button>
          <button className="ca-btn" disabled={busy} onClick={() => setTo("wishlist")}>Хочу</button>
        </>
        )}
      </div>
    </>
  );
}
