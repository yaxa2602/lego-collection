"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/client";

function errorMessage(message: string): string {
  if (message.includes("rate limit")) return "Слишком много попыток. Подождите немного и повторите.";
  if (message.includes("Invalid login credentials")) return "Неверный email или пароль.";
  if (message.includes("Email not confirmed")) return "Email не подтверждён. Проверьте почту.";
  if (message.includes("User already registered")) return "Пользователь с таким email уже зарегистрирован.";
  if (message.includes("Password should be at least")) return "Пароль слишком короткий (минимум 6 символов).";
  if (message.includes("valid email")) return "Введите корректный email.";
  return `Ошибка: ${message}`;
}

export default function LoginPage() {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  function showError(message: string) {
    setError(errorMessage(message));
  }

  async function signIn() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      showError(error.message);
      return;
    }
    router.push("/mine");
    router.refresh();
  }

  async function signUp() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      showError(error.message);
      return;
    }
    if (data.session) {
      // подтверждение почты отключено — вход сразу
      router.push("/mine");
      router.refresh();
      return;
    }
    setNotice("Аккаунт создан. Проверьте почту и подтвердите email, затем войдите.");
  }

  async function signOut() {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
    router.push("/login");
    router.refresh();
  }

  const isSignup = mode === "signup";

  if (currentEmail) {
    return (
      <main className="container" style={{ maxWidth: 420, paddingTop: 48 }}>
        <h1>Вы вошли</h1>
        <p className="muted">{currentEmail}</p>
        <button className="btn" onClick={signOut} disabled={busy}>
          {busy ? "Выходим…" : "Выйти"}
        </button>
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: 48 }}>
      <h1>{isSignup ? "Регистрация" : "Вход"}</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button
          className={`btn ${!isSignup ? "btn-active" : ""}`}
          onClick={() => { setMode("signin"); setError(null); setNotice(null); }}
        >
          Вход
        </button>
        <button
          className={`btn ${isSignup ? "btn-active" : ""}`}
          onClick={() => { setMode("signup"); setError(null); setNotice(null); }}
        >
          Регистрация
        </button>
      </div>

      <label className="field">
        <span>Email</span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>
      <label className="field">
        <span>{isSignup ? "Пароль (минимум 6 символов)" : "Пароль"}</span>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
      </label>

      {isSignup ? (
        <button className="btn btn-primary" onClick={signUp} disabled={!email || password.length < 6 || busy}>
          {busy ? "Регистрируем…" : "Зарегистрироваться"}
        </button>
      ) : (
        <button className="btn btn-primary" onClick={signIn} disabled={!email || !password || busy}>
          {busy ? "Входим…" : "Войти"}
        </button>
      )}

      {notice && <p className="muted">{notice}</p>}
      {error && <p className="error">{error}</p>}
    </main>
  );
}
