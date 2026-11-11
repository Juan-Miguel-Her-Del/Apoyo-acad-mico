"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

export default function RecoverPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [linkReady, setLinkReady] = useState<boolean | null>(null);
  const [complete, setComplete] = useState(false);
  const token = useRef("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const value = window.location.hash.slice(1);
    if (/^[0-9a-f]{64}$/.test(value)) token.current = value;
    setLinkReady(Boolean(token.current));
    if (window.location.hash) window.history.replaceState(null, "", "/recuperar");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token.current) { setMessage("Este enlace ya no es válido. Solicita uno nuevo desde el inicio de sesión."); return; }
    if (password !== confirmation) { setMessage("Las contraseñas no coinciden. Revísalas e inténtalo de nuevo."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/password-reset/confirm", { method: "POST",
        headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ token: token.current, password }) });
      const body = await response.json();
      setMessage(response.ok ? body.message : body.error ?? "No se pudo restablecer la contraseña.");
      if (response.ok) { setPassword(""); setConfirmation(""); token.current = ""; setComplete(true); }
    } catch { setMessage("No se pudo restablecer la contraseña. Inténtalo nuevamente."); }
    finally { setBusy(false); }
  }

  return <main className="recovery-layout">
    <div className="recovery-shell">
      <div className="recovery-brand"><span className="recovery-brand-mark" aria-hidden="true">A</span><span>Apoyo académico</span></div>
      <section className="recovery-card" aria-labelledby="recovery-title">
        <div className="recovery-symbol" aria-hidden="true">✦</div>
        <p className="recovery-eyebrow">SEGURIDAD DE TU CUENTA</p>
        <h1 id="recovery-title">{complete ? "Contraseña actualizada" : "Recupera el acceso a tu cuenta"}</h1>
        <p className="recovery-lead">{complete
          ? "Ya puedes volver a estudiar con tu nueva contraseña. Las sesiones anteriores se cerraron para proteger tu cuenta."
          : "Crea una contraseña nueva para continuar donde dejaste tus estudios."}</p>
        {linkReady === false && !complete && <div className="recovery-alert" role="alert">
          Este enlace no es válido o ya se utilizó. Vuelve al inicio de sesión y solicita uno nuevo.
        </div>}
        {linkReady && !complete && <form className="recovery-form" onSubmit={submit}>
          <label htmlFor="new-password">Nueva contraseña</label>
          <div className="recovery-password-field">
            <input id="new-password" type={visible ? "text" : "password"} autoComplete="new-password"
              minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="button" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setVisible((current) => !current)}>{visible ? "Ocultar" : "Mostrar"}</button>
          </div>
          <p className="recovery-hint">Usa al menos 12 caracteres. Evita repetir una contraseña que ya utilizas.</p>
          <label htmlFor="confirm-password">Confirma la contraseña</label>
          <input id="confirm-password" type={visible ? "text" : "password"} autoComplete="new-password"
            minLength={12} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
          <button className="primary-button recovery-submit" type="submit" disabled={busy || !password || !confirmation}>
            {busy ? "Guardando contraseña…" : "Guardar y volver a entrar"}
          </button>
        </form>}
        {message && <p className={complete ? "recovery-success" : "recovery-alert"} role="status">{message}</p>}
        <Link className={complete ? "recovery-home recovery-home-primary" : "recovery-home"} href="/">
          {complete ? "Ir al inicio de sesión" : "← Volver al inicio"}
        </Link>
      </section>
      <p className="recovery-footnote">Este flujo de recuperación corresponde a cuentas de estudiantes mayores de edad.</p>
    </div>
  </main>;
}
