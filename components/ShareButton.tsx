"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function ShareButton() {
  const supabase = createBrowserSupabase();
  const [slug, setSlug] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("shares").select("slug").maybeSingle();
        setSlug(data?.slug ?? null);
      } catch {
        setSlug(null);
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const newSlug = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
      const { error } = await supabase.from("shares").upsert({ user_id: user.id, slug: newSlug });
      if (error) {
        setError("Не получилось, попробуйте ещё раз.");
      } else {
        setSlug(newSlug);
      }
    } catch {
      setError("Не получилось, попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from("shares").delete().eq("user_id", user.id);
        if (error) {
          setError("Не получилось, попробуйте ещё раз.");
        } else {
          setSlug(null);
        }
      } else {
        setSlug(null);
      }
    } catch {
      setError("Не получилось, попробуйте ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    setError(null);
    if (!slug) return;
    try {
      await navigator.clipboard.writeText(`${location.origin}/c/${slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Не получилось, попробуйте ещё раз.");
    }
  }

  if (busy) return <button className="btn" disabled>Шаринг…</button>;
  return slug ? (
    <span className="set-actions">
      <button className="btn btn-primary" onClick={copy}>{copied ? "Скопировано ✓" : "Скопировать ссылку"}</button>
      <button className="btn" onClick={disable}>Выключить шаринг</button>
      {error && <span className="error">{error}</span>}
    </span>
  ) : (
    <>
      <button className="btn" onClick={enable}>Поделиться коллекцией</button>
      {error && <span className="error">{error}</span>}
    </>
  );
}
