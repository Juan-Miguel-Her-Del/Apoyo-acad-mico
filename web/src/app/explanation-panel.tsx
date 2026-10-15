"use client";

import { useState } from "react";

type Explanation = {
  explanation: string; example: string; reference: string; sourceVersion: string;
  gradeId: string; levelId: string; exampleIndex: number; hasAnotherExample: boolean;
};
type ResponseBody = Partial<Explanation> & { error?: string; retryable?: boolean };

export default function ExplanationPanel({ attemptId, subskillId, label, available = false }: {
  attemptId: string; subskillId: string; label: string; available?: boolean;
}) {
  const [content, setContent] = useState<Explanation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retryable, setRetryable] = useState(false);
  const [lastRequestedExampleIndex, setLastRequestedExampleIndex] = useState(0);

  async function requestExplanation(exampleIndex = 0) {
    if (busy) return;
    setLastRequestedExampleIndex(exampleIndex);
    setBusy(true); setError(""); setRetryable(false);
    try {
      const response = await fetch("/api/explanation", {
        method: "POST", cache: "no-store", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, subskillId, exampleIndex }),
      });
      const body = await response.json() as ResponseBody;
      if (!response.ok) {
        setError(body.error ?? "No pudimos cargar la explicación.");
        setRetryable(body.retryable === true);
      } else if (typeof body.explanation === "string" && typeof body.example === "string" &&
                 typeof body.reference === "string" && typeof body.sourceVersion === "string" &&
                 typeof body.gradeId === "string" && typeof body.exampleIndex === "number" &&
                 typeof body.hasAnotherExample === "boolean") {
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
      <button type="button" onClick={() => void requestExplanation(0)} disabled={busy}>{busy ? "Cargando explicación…" : `Solicitar explicación de ${label}`}</button>}
    {error && <p role="alert">{error} {retryable && <button type="button" onClick={() => void requestExplanation(lastRequestedExampleIndex)} disabled={busy}>Reintentar</button>}</p>}
    {content && <div>
      <p>Explicación revisada para grado {Number(content.gradeId.slice(1))}.</p>
      <p>{content.explanation}</p><p>{content.exampleIndex === 0 ? "Ejemplo" : "Otro ejemplo"}: {content.example}</p>
      <p>Fuente: {content.reference} (versión {content.sourceVersion}).</p>
      {content.hasAnotherExample && <button type="button" onClick={() => void requestExplanation(1)} disabled={busy}>
        {busy ? "Cargando otro ejemplo…" : "Ver otro ejemplo"}
      </button>}
    </div>}
  </section>;
}
