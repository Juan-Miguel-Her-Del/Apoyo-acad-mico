"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Selection } from "@/lib/selection";

type Question = { id: string; prompt: string; difficulty: 1 | 2; options: { id: string; text: string }[] };
type Session = {
  id: string; topicId: string; status: "open" | "completed";
  total: number; answered: number; correctCount: number;
  targetDifficulty: 1 | 2; difficultyFallback: boolean;
};
type Feedback = { correct: boolean; correctOptionId: string; explanation: string | null;
  explanationStatus: "approved" | "pending-review" };
type Coverage = { total: number; byDifficulty: { 1: number; 2: number };
  sufficientForTwoDistinctRounds: boolean; provisional: true };

function storageKey(topicId: string) { return `apoyo-practice:${topicId}`; }

export default function PracticeSession({ selection }: { selection: Selection }) {
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [optionId, setOptionId] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [coverageError, setCoverageError] = useState("");
  const sending = useRef(false);
  const topicId = selection.topicId ?? "";

  useEffect(() => {
    if (!selection.gradeId || !selection.subjectId || !topicId) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ gradeId: selection.gradeId, subjectId: selection.subjectId, topicId });
    const timer = window.setTimeout(() => {
      setCoverage(null); setCoverageError("");
      fetch(`/api/practice/coverage?${params}`, { cache: "no-store", signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("Cobertura no disponible.");
          return response.json();
        })
        .then((body) => setCoverage(body as Coverage))
        .catch(() => { if (!controller.signal.aborted) setCoverageError("No se pudo comprobar el banco de preguntas."); });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [selection.gradeId, selection.subjectId, topicId]);

  const restore = useCallback(async () => {
    if (!topicId) return;
    const id = window.localStorage.getItem(storageKey(topicId));
    if (!id) return;
    try {
      const response = await fetch(`/api/practice/session?sessionId=${encodeURIComponent(id)}`, {
        cache: "no-store", credentials: "same-origin",
      });
      if (response.status === 401 || response.status === 503) { setSession(null); setQuestions([]); return; }
      if (response.status === 404) { window.localStorage.removeItem(storageKey(topicId)); setSession(null); setQuestions([]); return; }
      const body = await response.json();
      if (!response.ok || !body.session || !Array.isArray(body.questions)) return;
      setSession(body.session);
      setQuestions(body.questions);
      setIndex(body.session.answered);
      setFeedback(null);
      setOptionId("");
    } catch {
      setError("No pudimos recuperar la práctica. Puedes intentar de nuevo.");
    }
  }, [topicId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void restore(); }, 0);
    window.addEventListener("ap-auth-changed", restore);
    return () => { window.clearTimeout(timer); window.removeEventListener("ap-auth-changed", restore); };
  }, [restore]);

  async function start() {
    if (!selection.gradeId || !selection.subjectId || !topicId || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/practice/start", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ gradeId: selection.gradeId, subjectId: selection.subjectId, topicId }),
      });
      const body = await response.json();
      if (!response.ok || !body.session || !Array.isArray(body.questions)) {
        throw new Error(response.status === 401 ? "Inicia sesión arriba para guardar una práctica de dos preguntas." : body.error ?? "No se pudo iniciar la práctica.");
      }
      window.localStorage.setItem(storageKey(topicId), body.session.id);
      setSession(body.session); setQuestions(body.questions);
      setIndex(0); setOptionId(""); setFeedback(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo iniciar la práctica.");
    } finally { setBusy(false); }
  }

  async function submit() {
    const question = questions[index];
    if (!session || !question || !optionId || feedback || sending.current) return;
    sending.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/practice/answer", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ sessionId: session.id, questionId: question.id, optionId }),
      });
      const body = await response.json();
      if (!response.ok || !body.session || !body.feedback) {
        throw new Error(response.status === 401 ? "Inicia sesión arriba para continuar." : body.error ?? "No se pudo evaluar la respuesta.");
      }
      setSession(body.session);
      setFeedback(body.feedback);
      if (body.session.status === "completed") window.dispatchEvent(new Event("ap-progress-saved"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo evaluar la respuesta.");
    } finally { sending.current = false; setBusy(false); }
  }

  async function finish() {
    if (!session || session.status !== "open" || busy || sending.current) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/practice/finish", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ sessionId: session.id }),
      });
      const body = await response.json();
      if (!response.ok || !body.session) throw new Error(body.error ?? "No se pudo terminar la práctica.");
      setSession(body.session);
      setFeedback(null);
      window.dispatchEvent(new Event("ap-progress-saved"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo terminar la práctica.");
    } finally { setBusy(false); }
  }

  const question = questions[index];
  return <div className="practice-session" aria-labelledby="practice-session-title">
    <h4 id="practice-session-title">Práctica con seguimiento</h4>
    <p>Rondas de dos preguntas provisionales sobre este tema. Con una cuenta de demostración, tus respuestas y el resultado quedan guardados para retomarlos.</p>
    {coverage && <p className="practice-coverage">Banco provisional: {coverage.total} preguntas; nivel 1: {coverage.byDifficulty[1]}; nivel 2: {coverage.byDifficulty[2]}. {coverage.sufficientForTwoDistinctRounds ? "Cobertura suficiente para dos rondas distintas." : "Cobertura insuficiente para nuevas rondas; requiere más preguntas."}</p>}
    {coverageError && <p className="diagnostic-error" role="alert">{coverageError}</p>}
    {!session && <button className="primary-button" type="button" onClick={start} disabled={busy || coverage?.sufficientForTwoDistinctRounds === false}>{busy ? "Preparando…" : "Empezar práctica de dos preguntas"}</button>}
    {session?.status === "open" && question && <div className="practice-question">
      <p className="question-progress">Pregunta {index + 1} de {session.total}</p>
      <p>Nivel de esta pregunta: {question.difficulty}. {session.difficultyFallback ? "El banco no tenía dos preguntas nuevas del nivel objetivo; esta ronda usa las nuevas disponibles." : ""}</p>
      <progress value={index + 1} max={session.total} aria-label="Avance de la práctica" />
      <fieldset disabled={busy || feedback !== null}><legend>{question.prompt}</legend>
        {question.options.map((option) => <label className="answer-option" key={option.id}>
          <input type="radio" name={question.id} value={option.id} checked={optionId === option.id} onChange={() => setOptionId(option.id)} />
          {option.text}
        </label>)}
      </fieldset>
      {!feedback && <button className="primary-button" type="button" onClick={submit} disabled={busy || !optionId}>{busy ? "Revisando…" : "Revisar respuesta"}</button>}
      {feedback && <div className={`answer-feedback ${feedback.correct ? "correct" : "incorrect"}`} role="status">
        <strong>{feedback.correct ? "Respuesta correcta" : "Respuesta incorrecta"}</strong>
        <p>{feedback.explanationStatus === "pending-review" ? "Explicación pendiente de revisión docente." : feedback.explanation}</p>
        {!feedback.correct && <p>Respuesta de referencia: {question.options.find((option) => option.id === feedback.correctOptionId)?.text}.</p>}
        <button className="primary-button" type="button" onClick={() => { setIndex(index + 1); setOptionId(""); setFeedback(null); }}>Siguiente pregunta</button>
      </div>}
    </div>}
    {session?.status === "open" && <button className="text-button" type="button" onClick={finish} disabled={busy}>Terminar práctica ahora</button>}
    {session?.status === "completed" && feedback && question && <div className={`answer-feedback ${feedback.correct ? "correct" : "incorrect"}`} role="status">
      <strong>{feedback.correct ? "Respuesta correcta" : "Respuesta incorrecta"}</strong>
      <p>{feedback.explanationStatus === "pending-review" ? "Explicación pendiente de revisión docente." : feedback.explanation}</p>
      {!feedback.correct && <p>Respuesta de referencia: {question.options.find((option) => option.id === feedback.correctOptionId)?.text}.</p>}
      <button className="primary-button" type="button" onClick={() => setFeedback(null)}>Ver resultado</button>
    </div>}
    {session?.status === "completed" && !feedback && <div className="practice-result" role="status">
      <strong>{session.answered === 0 ? "Práctica terminada sin respuestas." : `Práctica terminada: ${session.correctCount} de ${session.answered} respuestas correctas.`}</strong>
      <p>{session.answered === 0 ? "No hay un resultado que calcular todavía." : `${session.answered} de ${session.total} preguntas respondidas. ${session.total - session.answered} quedaron sin responder.`}</p>
      <p>Esta sesión quedó guardada en tu cuenta de demostración. Puedes consultar el historial arriba.</p>
      <button className="text-button" type="button" onClick={start} disabled={busy}>Iniciar otra ronda con preguntas nuevas</button>
    </div>}
    {error && <p className="diagnostic-error" role="alert">{error}</p>}
  </div>;
}
