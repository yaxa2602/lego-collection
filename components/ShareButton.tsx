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
