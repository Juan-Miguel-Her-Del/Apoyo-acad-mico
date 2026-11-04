"use client";

import { useEffect, useRef, useState } from "react";
import { evaluateShortCheck, prepareShortCheck, updateRating,
  type ExplanationRating, type RatingState, type ShortCheckSource } from "@/lib/explanation-followup";

export default function ExplanationFollowup({ explanationId, topicId, question, mode }: {
  explanationId: string;
  topicId?: string;
  question?: ShortCheckSource | null;
  mode: "demo" | "published";
}) {
  const [rating, setRating] = useState<RatingState>(null);
  const [accountAvailable, setAccountAvailable] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(mode === "demo" && !!topicId);
  const authEpoch = useRef(0);
  const [answer, setAnswer] = useState("");
  const [checkedAnswer, setCheckedAnswer] = useState("");
  const check = prepareShortCheck(question, explanationId);
  const currentRating = rating?.explanationId === explanationId ? rating.value : null;
  const validQuestion = mode === "demo" || question?.validation === "approved";
  const result = checkedAnswer && validQuestion ? evaluateShortCheck(check, checkedAnswer) : null;

  useEffect(() => {
    if (mode !== "demo" || !topicId) return;
    let mounted = true;
    async function load() {
      const epoch = ++authEpoch.current;
      setRatingLoading(true);
      try {
        const response = await fetch(`/api/explanation/demo-feedback?topicId=${encodeURIComponent(topicId!)}`,
          { cache: "no-store", credentials: "same-origin" });
        if (!mounted || epoch !== authEpoch.current) return;
        if (response.status === 401) {
          setAccountAvailable(false);
          setRating(null);
          setRatingMessage("");
          return;
        }
        if (!response.ok) throw new Error("No se pudo cargar la valoración guardada.");
        const body = await response.json() as { feedback?: { explanationId: string; value: ExplanationRating } | null };
        if (!mounted || epoch !== authEpoch.current) return;
        setAccountAvailable(true);
        setRating(body.feedback?.explanationId === explanationId
          ? { explanationId, value: body.feedback.value } : null);
        setRatingMessage("");
      } catch {
        if (mounted && epoch === authEpoch.current) setRatingMessage("No se pudo cargar la valoración guardada.");
      } finally {
        if (mounted && epoch === authEpoch.current) setRatingLoading(false);
      }
    }
    const changed = () => { setRating(null); setAccountAvailable(false); setRatingLoading(true); void load(); };
    window.addEventListener("ap-auth-changed", changed);
    void load();
    return () => { mounted = false; window.removeEventListener("ap-auth-changed", changed); };
  }, [explanationId, mode, topicId]);

  async function selectRating(value: ExplanationRating) {
    if (ratingBusy || ratingLoading) return;
    if (mode !== "demo" || !topicId || !accountAvailable) {
      setRating((current) => updateRating(current, explanationId, value));
      setRatingMessage("Valoración temporal; inicia sesión en tu cuenta para guardarla.");
      return;
    }
    setRatingBusy(true);
    setRatingMessage("");
    const epoch = authEpoch.current;
    try {
      const response = await fetch("/api/explanation/demo-feedback", {
        method: "POST", cache: "no-store", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, explanationId, value }),
      });
      if (epoch !== authEpoch.current) return;
      if (!response.ok) throw new Error("No se pudo guardar la valoración. Inténtalo de nuevo.");
      const body = await response.json() as { feedback?: { explanationId: string; value: ExplanationRating } };
      if (body.feedback?.explanationId !== explanationId || body.feedback.value !== value) {
        throw new Error("No se pudo confirmar la valoración guardada.");
      }
      setRating({ explanationId, value });
      setRatingMessage("Valoración guardada en tu cuenta.");
    } catch (error) {
      if (epoch === authEpoch.current) setRatingMessage(error instanceof Error ? error.message : "No se pudo guardar la valoración.");
    } finally { if (epoch === authEpoch.current) setRatingBusy(false); }
  }

  return <section className="explanation-followup" aria-label="Después de la explicación">
    <h4>¿Te ayudó esta explicación?</h4>
    <p>{mode === "demo" && accountAvailable
      ? "La valoración de esta explicación se guarda en tu cuenta."
      : "Esta valoración es temporal y no se guarda en una cuenta."}</p>
    <div role="group" aria-label="Valorar explicación">
      <button type="button" disabled={ratingBusy || ratingLoading} aria-pressed={currentRating === "helped"} onClick={() => void selectRating("helped")}>Sí, me ayudó</button>{" "}
      <button type="button" disabled={ratingBusy || ratingLoading} aria-pressed={currentRating === "confused"} onClick={() => void selectRating("confused")}>Todavía estoy confundido</button>
    </div>
    {ratingLoading && <p>Recuperando valoración anterior…</p>}
    {currentRating && <p role="status">Valoración de esta explicación: {currentRating === "helped" ? "me ayudó" : "todavía estoy confundido"}. Puedes cambiarla.</p>}
    {ratingMessage && <p role="status">{ratingMessage}</p>}

    <h4>Comprueba lo que entendiste</h4>
    {!validQuestion && <p>La pregunta de comprobación requiere revisión académica antes de publicarse.</p>}
    {validQuestion && check.status === "invalid-source" && <p>La pregunta de esta explicación todavía no está disponible.</p>}
    {validQuestion && check.status === "missing-reference" && <p>La pregunta no tiene solución de referencia; no se puede calificar.</p>}
    {validQuestion && check.status === "ready" && <form onSubmit={(event) => { event.preventDefault(); setCheckedAnswer(answer); }}>
      <label htmlFor={`short-check-${check.id}`}>{check.prompt}</label>
      <input id={`short-check-${check.id}`} type="text" maxLength={200} value={answer}
        onChange={(event) => { setAnswer(event.target.value); setCheckedAnswer(""); }} />
      <button type="submit" disabled={!answer.trim()}>Comprobar respuesta</button>
      {result && <p role="status">{result.status === "correct"
        ? "Coincide con la respuesta de referencia."
        : result.status === "incorrect"
          ? `No coincide con la respuesta de referencia: ${result.referenceAnswer}.`
          : "No se puede comprobar esta respuesta."}
        {mode === "demo" && " Esta comparación es provisional; no es una calificación académica."}</p>}
    </form>}
  </section>;
}
