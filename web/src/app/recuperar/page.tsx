"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

export default function RecoverPage() {
  const [password, setPassword] = useState("");
  const token = useRef("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const value = window.location.hash.slice(1);
    if (/^[0-9a-f]{64}$/.test(value)) token.current = value;
    if (window.location.hash) window.history.replaceState(null, "", "/recuperar");
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.current) { setMessage("Enlace no válido o vencido."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/password-reset/confirm", { method: "POST",
        headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ token: token.current, password }) });
      const body = await response.json();
      setMessage(response.ok ? body.message : body.error ?? "No se pudo restablecer la contraseña.");
      if (response.ok) { setPassword(""); token.current = ""; }
    } catch { setMessage("No se pudo restablecer la contraseña."); }
    finally { setBusy(false); }
  }
  return <main className="app-shell"><section className="account-card"><h1>Restablecer contraseña</h1>
    <p>Esta recuperación corresponde a cuentas de estudiantes mayores de edad.</p>
    <form onSubmit={submit}><label>Nueva contraseña<input type="password" autoComplete="new-password" minLength={12}
      maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      <button className="primary-button" type="submit" disabled={busy}>Guardar nueva contraseña</button></form>
    {message && <p role="status">{message}</p>}<Link href="/">Volver al inicio</Link>
  </section></main>;
}
