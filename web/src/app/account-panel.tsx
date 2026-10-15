"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

type Account = { id: string; email: string };
type ProgressItem = {
  gradeId: string;
  subjectId: string;
  topicId: string;
  kind: "study" | "diagnostic";
  completed: boolean;
  updatedAt: string;
};
type PracticeItem = {
  id: string; topicId: string; status: "open" | "completed";
  total: number; answered: number; correctCount: number;
  completedAt: string | null;
};

export default function AccountPanel() {
  const [account, setAccount] = useState<Account | null>(null);
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const authEpoch = useRef(0);

  const refreshProgress = useCallback(async () => {
    const epoch = authEpoch.current;
    try {
      const [progressResponse, practiceResponse] = await Promise.all([
        fetch("/api/progress", { cache: "no-store", credentials: "same-origin" }),
        fetch("/api/practice/sessions", { cache: "no-store", credentials: "same-origin" }),
      ]);
      if (epoch !== authEpoch.current) return;
      if (!progressResponse.ok || !practiceResponse.ok) { setItems([]); setPracticeItems([]); return; }
      const [progressBody, practiceBody] = await Promise.all([progressResponse.json(), practiceResponse.json()]);
      if (epoch !== authEpoch.current) return;
      setItems(Array.isArray(progressBody.items) ? progressBody.items : []);
      setPracticeItems(Array.isArray(practiceBody.items) ? practiceBody.items : []);
    } catch {
      if (epoch === authEpoch.current) setMessage("No se pudo cargar tu progreso. Inténtalo de nuevo.");
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const epoch = authEpoch.current;
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((body) => {
        if (!mounted || epoch !== authEpoch.current || !body?.user) return;
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
      authEpoch.current += 1;
      setAccount(body.user);
      setPassword("");
      setMessage(mode === "register" ? "Cuenta creada. Ya puedes guardar tu avance de prueba." : "Sesión iniciada.");
      window.dispatchEvent(new Event("ap-auth-changed"));
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
      authEpoch.current += 1;
      setAccount(null);
      setItems([]);
      setPracticeItems([]);
      setMessage("Sesión cerrada.");
      window.dispatchEvent(new Event("ap-auth-changed"));
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
      <h3>Diagnósticos guardados</h3>
      {items.filter((item) => item.kind === "diagnostic").length === 0 ? <p>Aún no has guardado un diagnóstico.</p> : <ul>{items.filter((item) => item.kind === "diagnostic").map((item) => <li key={`${item.topicId}-${item.kind}`}>
        {item.topicId} · completado
      </li>)}</ul>}
      <h3>Historial de práctica</h3>
      {practiceItems.length === 0 ? <p>Aún no has iniciado una práctica con seguimiento.</p> : <ul>{practiceItems.map((item) => <li key={item.id}>
        {item.topicId} · {item.status === "completed" ? `${item.correctCount}/${item.total} correctas` : `${item.answered}/${item.total} respondidas; pendiente`}
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
