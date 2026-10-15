"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Account = { id: string; email: string };
type ProgressItem = {
  gradeId: string;
  subjectId: string;
  topicId: string;
  kind: "study" | "diagnostic";
  completed: boolean;
  updatedAt: string;
};

export default function AccountPanel() {
  const [account, setAccount] = useState<Account | null>(null);
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refreshProgress = useCallback(async () => {
    try {
      const response = await fetch("/api/progress", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) { setItems([]); return; }
      const body = await response.json();
      setItems(Array.isArray(body.items) ? body.items : []);
    } catch {
      setMessage("No se pudo cargar tu progreso. Inténtalo de nuevo.");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((body) => {
        if (!mounted || !body?.user) return;
        setAccount(body.user);
        void refreshProgress();
      })
      .catch(() => { if (mounted) setMessage("No se pudo comprobar la sesión."); });
    const refresh = () => { void refreshProgress(); };
    window.addEventListener("ap-progress-saved", refresh);
    return () => { mounted = false; window.removeEventListener("ap-progress-saved", refresh); };
  }, [refreshProgress]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify(mode === "register" ? { email, password, adultConfirmed } : { email, password }),
      });
      const body = await response.json();
      if (!response.ok || !body.user) throw new Error(typeof body.error === "string" ? body.error : "No se pudo abrir la cuenta.");
      setAccount(body.user);
      setPassword("");
      setMessage(mode === "register" ? "Cuenta creada. Ya puedes guardar tu avance de prueba." : "Sesión iniciada.");
      await refreshProgress();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "No se pudo abrir la cuenta.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!response.ok) throw new Error("No se pudo cerrar la sesión.");
      setAccount(null);
      setItems([]);
      setMessage("Sesión cerrada.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "No se pudo cerrar la sesión.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="account-card" aria-labelledby="account-title">
    <div><p className="eyebrow">Cuenta para la demostración</p><h2 id="account-title">Guarda tu recorrido</h2>
      <p>El registro local usa cuentas persistentes de personas adultas o evaluadores. No registres datos de menores reales mientras se define y verifica la autorización de sus representantes.</p></div>
    {account ? <div className="account-panel">
      <p>Sesión iniciada como <strong>{account.email}</strong>.</p>
      <button className="text-button" type="button" onClick={logout} disabled={busy}>Cerrar sesión</button>
      <h3>Progreso guardado</h3>
      {items.length === 0 ? <p>Aún no has guardado un diagnóstico o una práctica.</p> : <ul>{items.map((item) => <li key={`${item.topicId}-${item.kind}`}>
        {item.kind === "study" ? "Práctica" : "Diagnóstico"} · {item.topicId} · completado
      </li>)}</ul>}
      <button className="text-button" type="button" onClick={() => void refreshProgress()}>Actualizar progreso</button>
    </div> : <div className="account-panel">
      <div className="account-tabs"><button type="button" aria-pressed={mode === "login"} onClick={() => { setMode("login"); setMessage(""); }}>Iniciar sesión</button><button type="button" aria-pressed={mode === "register"} onClick={() => { setMode("register"); setMessage(""); }}>Crear cuenta</button></div>
      <form onSubmit={submit}>
        <label>Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 12 : 1} required /></label>
        {mode === "register" && <label className="account-check"><input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} required /> Confirmo que soy mayor de edad y usaré esta cuenta solo para una demostración con datos de prueba.</label>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Procesando…" : mode === "register" ? "Crear cuenta" : "Entrar"}</button>
      </form>
    </div>}
    {message && <p className="account-message" role="status">{message}</p>}
  </section>;
}
