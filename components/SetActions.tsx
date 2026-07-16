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
