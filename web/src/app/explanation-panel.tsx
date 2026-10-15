"use client";

import { useState } from "react";

type Explanation = {
  explanation: string; example: string; reference: string; sourceVersion: string;
};
type ResponseBody = Partial<Explanation> & { error?: string; retryable?: boolean };

export default function ExplanationPanel({ attemptId, subskillId, label, available = false }: {
  attemptId: string; subskillId: string; label: string; available?: boolean;
}) {
  const [content, setContent] = useState<Explanation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retryable, setRetryable] = useState(false);

  async function requestExplanation() {
    if (busy) return;
    setBusy(true); setError(""); setRetryable(false);
    try {
      const response = await fetch("/api/explanation", {
        method: "POST", cache: "no-store", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, subskillId }),
      });
      const body = await response.json() as ResponseBody;
      if (!response.ok) {
        setError(body.error ?? "No pudimos cargar la explicación.");
        setRetryable(body.retryable === true);
      } else if (typeof body.explanation === "string" && typeof body.example === "string" &&
                 typeof body.reference === "string" && typeof body.sourceVersion === "string") {
        setContent(body as Explanation);
      } else {
        setError("La explicación recibida no es válida. Inténtalo de nuevo."); setRetryable(true);
      }
    } catch {
      setError("No pudimos cargar la explicación ahora. Inténtalo de nuevo."); setRetryable(true);
    } finally { setBusy(false); }
  }

  return <section aria-label={`Explicación de ${label}`}>
    {!available && <p>La explicación de {label} está pendiente de revisión académica. Aún no está disponible.</p>}
    {available && !content && !error &&
      <button type="button" onClick={requestExplanation} disabled={busy}>{busy ? "Cargando explicación…" : `Solicitar explicación de ${label}`}</button>}
    {error && <p role="alert">{error} {retryable && <button type="button" onClick={requestExplanation} disabled={busy}>Reintentar</button>}</p>}
    {content && <div>
      <p>{content.explanation}</p><p>Ejemplo: {content.example}</p>
      <p>Fuente: {content.reference} (versión {content.sourceVersion}).</p>
    </div>}
  </section>;
}
