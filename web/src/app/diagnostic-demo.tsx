"use client";

import { useEffect, useRef, useState } from "react";
import { analyzeDemoSkills } from "@/lib/diagnostic-analysis";
import type { QuestionView } from "@/lib/diagnostic";
import type { Selection } from "@/lib/selection";
import StudyDemo from "./study-demo";

type Feedback =
  | { state: "evaluated"; correct: boolean; correctOptionId: string; explanation: string }
  | { state: "pending"; message: string };
type Answer = { questionId: string; optionId: string; correct: boolean };

export default function DiagnosticDemo({ selection }: { selection: Selection }) {
  const [stage, setStage] = useState<"idle" | "loading" | "intro" | "question" | "finished" | "study">("idle");
  const [questions, setQuestions] = useState<QuestionView[]>([]);
  const [index, setIndex] = useState(0);
  const [optionId, setOptionId] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const request = useRef<AbortController | null>(null);
  const submitting = useRef(false);
  useEffect(() => () => request.current?.abort(), []);

  const ready = Boolean(selection.gradeId && selection.subjectId && selection.topicId);
  const question = questions[index];
  const analysis = analyzeDemoSkills(questions, answers);
  const difficulties = analysis.results.filter((result) => result.status === "dificultad-demo");

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
    setStage("idle"); setQuestions([]); setIndex(0); setOptionId(""); setAnswers([]); setFeedback(null); setError(""); setBusy(false); setSaveMessage("");
  }

  async function saveDiagnostic() {
    if (!ready || stage !== "finished" || saving) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const response = await fetch("/api/progress", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ gradeId: selection.gradeId, subjectId: selection.subjectId, topicId: selection.topicId, kind: "diagnostic", completed: true }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? "Inicia sesión arriba para guardar este recorrido." : body.error ?? "No se pudo guardar el recorrido.");
      setSaveMessage("Diagnóstico de demostración guardado en tu cuenta.");
      window.dispatchEvent(new Event("ap-progress-saved"));
    } catch (cause) {
      setSaveMessage(cause instanceof Error ? cause.message : "No se pudo guardar el recorrido.");
    } finally {
      setSaving(false);
    }
  }

  if (stage === "study") return <>
    <StudyDemo selection={selection} />
    <button className="text-button" type="button" onClick={() => setStage("finished")}>Volver al resumen del diagnóstico</button>
  </>;

  return <section className="diagnostic-card" aria-labelledby="diagnostic-title">
    <p className="eyebrow">Demostración · diagnóstico y estudio</p>
    <h2 id="diagnostic-title">Prueba un diagnóstico corto</h2>
    <p className="diagnostic-disclaimer">Las preguntas son ejemplos provisionales sin revisión docente. Esta experiencia no es una calificación ni se guarda en una cuenta. Al terminar podrás estudiar el tema y practicar con otro ejemplo.</p>
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
    {stage === "finished" && <div className="diagnostic-panel" role="status"><h3>Terminaste la demostración</h3><p>Respondiste {answers.length} de {questions.length} preguntas de prueba. Acertaste {answers.filter((answer) => answer.correct).length}.</p>
      <h4>Resultados por subtema</h4>
      <p>Regla provisional: se necesitan al menos 2 respuestas del mismo subtema. Con 0 aciertos aparece una señal de dificultad; con todos los aciertos, ninguna señal; un resultado mixto queda indeterminado. No equivale a un diagnóstico académico.</p>
      {difficulties.length > 0 ? <p className="skill-summary">Señales de dificultad en esta prueba: {difficulties.map((result) => result.skill).join(", ")}.</p> : <p className="skill-summary">No hay subtemas con una señal de dificultad según esta regla. Revisa los estados indeterminados antes de sacar conclusiones.</p>}
      {analysis.results.length > 0 && <ul className="skill-results">{analysis.results.map((result) => <li key={result.skill}>
        <strong>{result.skill}</strong>: {result.status === "dificultad-demo" ? "señal de dificultad (demo)" : result.status === "sin-senal-demo" ? "sin señal de dificultad en esta prueba" : "indeterminado: evidencia insuficiente o resultado mixto"}.
        <span> {result.correct}/{result.answered} aciertos; preguntas {result.questionIds.map((id) => questions.findIndex((item) => item.id === id) + 1).join(", ")}.</span>
      </li>)}</ul>}
      {analysis.unmappedQuestionIds.length > 0 && <p className="diagnostic-error">Resultado incompleto: {analysis.unmappedQuestionIds.length} {analysis.unmappedQuestionIds.length === 1 ? "pregunta no tiene" : "preguntas no tienen"} un subtema vinculado; no se les asignó dificultad.</p>}
      <p>Este resumen es orientativo; no equivale a una evaluación validada. Puedes guardar que completaste el recorrido, pero no se guarda una calificación.</p><button className="primary-button" type="button" onClick={() => setStage("study")}>Continuar a estudiar</button><button className="text-button" type="button" onClick={saveDiagnostic} disabled={saving}>{saving ? "Guardando…" : "Guardar diagnóstico en mi cuenta"}</button><button className="text-button" type="button" onClick={reset}>Volver a empezar</button>{saveMessage && <p role="status">{saveMessage}</p>}</div>}
    {error && <p className="diagnostic-error" role="alert">{error}</p>}
    {stage !== "idle" && stage !== "finished" && <button className="text-button" type="button" onClick={reset}>Salir de la demostración</button>}
  </section>;
}
