"use client";

import { useState } from "react";
import { evaluateShortCheck, prepareShortCheck, updateRating,
  type ExplanationRating, type RatingState, type ShortCheckSource } from "@/lib/explanation-followup";

export default function ExplanationFollowup({ explanationId, question, mode }: {
  explanationId: string;
  question?: ShortCheckSource | null;
  mode: "demo" | "published";
}) {
  const [rating, setRating] = useState<RatingState>(null);
  const [answer, setAnswer] = useState("");
  const [checkedAnswer, setCheckedAnswer] = useState("");
  const check = prepareShortCheck(question, explanationId);
  const currentRating = rating?.explanationId === explanationId ? rating.value : null;
  const validQuestion = mode === "demo" || question?.validation === "approved";
  const result = checkedAnswer && validQuestion ? evaluateShortCheck(check, checkedAnswer) : null;

  function selectRating(value: ExplanationRating) {
    setRating((current) => updateRating(current, explanationId, value));
  }

  return <section className="quick-practice" aria-label="Después de la explicación">
    <h4>¿Te ayudó esta explicación?</h4>
    <p>Tu valoración se muestra en esta vista y aún no se guarda en una cuenta.</p>
    <div role="group" aria-label="Valorar explicación">
      <button type="button" aria-pressed={currentRating === "helped"} onClick={() => selectRating("helped")}>Sí, me ayudó</button>{" "}
      <button type="button" aria-pressed={currentRating === "confused"} onClick={() => selectRating("confused")}>Todavía estoy confundido</button>
    </div>
    {currentRating && <p role="status">Valoración de esta explicación: {currentRating === "helped" ? "me ayudó" : "todavía estoy confundido"}. Puedes cambiarla.</p>}

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
