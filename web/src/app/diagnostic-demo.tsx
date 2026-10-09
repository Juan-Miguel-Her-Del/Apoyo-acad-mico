"use client";

import { useEffect, useRef, useState } from "react";
import type { QuestionView } from "@/lib/diagnostic";
import type { Selection } from "@/lib/selection";

type Feedback =
  | { state: "evaluated"; correct: boolean; correctOptionId: string; explanation: string }
  | { state: "pending"; message: string };
type Answer = { questionId: string; optionId: string; correct: boolean };

export default function DiagnosticDemo({ selection }: { selection: Selection }) {
  const [stage, setStage] = useState<"idle" | "loading" | "intro" | "question" | "finished">("idle");
  const [questions, setQuestions] = useState<QuestionView[]>([]);
  const [index, setIndex] = useState(0);
  const [optionId, setOptionId] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const submitting = useRef(false);
  useEffect(() => () => request.current?.abort(), []);

  const ready = Boolean(selection.gradeId && selection.subjectId && selection.topicId);
  const question = questions[index];

  async function prepare() {
    if (!ready || stage === "loading") return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setStage("loading");
    setError("");
    try {
      const params = new URLSearchParams({ mode: "demo", grade: selection.gradeId!, subject: selection.subjectId!, topic: selection.topicId! });
      const response = await fetch(`/api/diagnostic?${params}`, { signal: controller.signal, cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "No se pudo preparar el diagnóstico.");
      if (body.mode !== "demo" || !Array.isArray(body.questions) || body.questions.length < 1) throw new Error("No hay preguntas para esta demostración.");
      if (!controller.signal.aborted) { setQuestions(body.questions); setStage("intro"); }
    } catch (cause) {
      if (!controller.signal.aborted) { setStage("idle"); setError(cause instanceof Error ? cause.message : "No se pudo cargar la demostración."); }
    }
  }

  async function submit() {
    if (!question || !optionId || feedback?.state === "evaluated" || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    setFeedback(null);
    const controller = new AbortController();
    request.current = controller;
    try {
      const response = await fetch("/api/diagnostic", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", signal: controller.signal,
        body: JSON.stringify({ mode: "demo", gradeId: selection.gradeId, subjectId: selection.subjectId, topicId: selection.topicId, questionId: question.id, optionId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "No pudimos revisar tu respuesta.");
      if (body.mode !== "demo" || typeof body.correct !== "boolean" || typeof body.correctOptionId !== "string" || typeof body.explanation !== "string") throw new Error("La respuesta del servidor no es válida.");
      if (!controller.signal.aborted) {
        setFeedback({ state: "evaluated", correct: body.correct, correctOptionId: body.correctOptionId, explanation: body.explanation });
        setAnswers((current) => [...current, { questionId: question.id, optionId, correct: body.correct }]);
      }
    } catch (cause) {
      if (!controller.signal.aborted) setFeedback({ state: "pending", message: cause instanceof Error ? cause.message : "No pudimos revisar tu respuesta." });
    } finally {
      submitting.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  function next() {
    setFeedback(null);
    setOptionId("");
    setError("");
    if (index + 1 >= questions.length) setStage("finished");
    else setIndex(index + 1);
  }

  function reset() {
    request.current?.abort();
    setStage("idle"); setQuestions([]); setIndex(0); setOptionId(""); setAnswers([]); setFeedback(null); setError(""); setBusy(false);
  }

  return <section className="diagnostic-card" aria-labelledby="diagnostic-title">
    <p className="eyebrow">Demostración · Sprint 2</p>
    <h2 id="diagnostic-title">Prueba un diagnóstico corto</h2>
    <p className="diagnostic-disclaimer">Las preguntas son ejemplos sin revisión docente. Esta experiencia no es una calificación ni se guarda en una cuenta. El contenido para estudiantes sigue pendiente de aprobación.</p>
    {stage === "idle" && <button className="primary-button" type="button" onClick={prepare} disabled={!ready}>Empezar a estudiar (demo)</button>}
    {stage === "loading" && <p role="status">Preparando preguntas de demostración…</p>}
    {stage === "intro" && <div className="diagnostic-panel"><h3>Antes de comenzar</h3><p>Responde con calma. Verás {questions.length} {questions.length === 1 ? "pregunta de prueba" : "preguntas de prueba"} sobre el tema elegido. No recibirás una nota académica y podrás salir cuando quieras.</p><button className="primary-button" type="button" onClick={() => setStage("question")}>Comenzar preguntas</button></div>}
    {stage === "question" && question && <div className="diagnostic-panel">
      <p className="question-progress" aria-live="polite">Pregunta {index + 1} de {questions.length}</p>
      <progress value={index + 1} max={questions.length} aria-label="Avance del diagnóstico" />
      <h3>{question.prompt}</h3>
      <fieldset disabled={feedback?.state === "evaluated" || busy}><legend>Elige una respuesta</legend>
        {question.options.map((option) => <label className="answer-option" key={option.id}><input type="radio" name={question.id} value={option.id} checked={optionId === option.id} onChange={() => setOptionId(option.id)} />{option.text}</label>)}
      </fieldset>
      {feedback?.state !== "evaluated" && <button className="primary-button" type="button" onClick={submit} disabled={!optionId || busy}>{busy ? "Revisando…" : feedback?.state === "pending" ? "Reintentar evaluación" : "Revisar respuesta"}</button>}
      {feedback?.state === "pending" && <div className="answer-feedback pending" role="status"><strong>Evaluación pendiente</strong><p>{feedback.message} Conservamos tu selección para que puedas reintentar; aún no contamos esta respuesta como acierto ni error.</p></div>}
      {feedback?.state === "evaluated" && <div className={`answer-feedback ${feedback.correct ? "correct" : "incorrect"}`} role="status"><strong>{feedback.correct ? "Respuesta correcta" : "Respuesta incorrecta"}</strong><p>{feedback.explanation}</p><p>Respuesta de referencia: {question.options.find((option) => option.id === feedback.correctOptionId)?.text}</p><button className="primary-button" type="button" onClick={next}>{index + 1 === questions.length ? "Ver resumen" : "Siguiente pregunta"}</button></div>}
    </div>}
    {stage === "finished" && <div className="diagnostic-panel" role="status"><h3>Terminaste la demostración</h3><p>Respondiste {answers.length} de {questions.length} preguntas de prueba. Acertaste {answers.filter((answer) => answer.correct).length}.</p><p>Este resumen es orientativo; no equivale a una evaluación validada y se perderá al cerrar o recargar la página.</p><button className="primary-button" type="button" onClick={reset}>Volver a empezar</button></div>}
    {error && <p className="diagnostic-error" role="alert">{error}</p>}
    {stage !== "idle" && stage !== "finished" && <button className="text-button" type="button" onClick={reset}>Salir de la demostración</button>}
  </section>;
}
