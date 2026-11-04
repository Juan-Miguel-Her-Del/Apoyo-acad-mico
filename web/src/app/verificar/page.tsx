"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("Confirmando tu correo…");
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = window.location.hash.slice(1);
    window.history.replaceState(null, "", "/verificar");
    if (!/^[0-9a-f]{64}$/.test(token)) {
      queueMicrotask(() => {
        setMessage("El enlace no es válido. Solicita uno nuevo desde el registro.");
        setFailed(true);
      });
      return;
    }
    fetch("/api/auth/verify", { method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "No pudimos confirmar el correo.");
        window.location.replace("/#estudiar");
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "No pudimos confirmar el correo.");
        setFailed(true);
      });
  }, []);

  return <main className="app-shell"><section className="verify-card" aria-live="polite">
    <p className="eyebrow">Apoyo académico</p>
    <h1>Confirma tu correo</h1>
    <p>{message}</p>
    {failed && <Link href="/#cuenta">Volver al registro</Link>}
  </section></main>;
}
