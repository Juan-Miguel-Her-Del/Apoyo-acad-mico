"use client";

import { useEffect, useRef, useState } from "react";
import { diagnosticSkillInsights, MIN_DIAGNOSTIC_SKILL_ANSWERS } from "@/lib/diagnostic-analysis";
import type { QuestionView } from "@/lib/diagnostic";
import type { Selection } from "@/lib/selection";
import ProvisionalExplanationPanel from "./provisional-explanation-panel";
import StudyDemo from "./study-demo";

type Attempt = {
  id: string;
  status: "open" | "completed";
  answered: number;
  correctCount: number;
  total: number;
  completionReason?: string | null;
};
type Question = QuestionView & { difficulty?: string | number; requestedDifficulty?: string | number; fallback?: boolean };
type Answer = { questionId: string; optionId: string; correct: boolean; skill?: string };
type Feedback = { questionId: string; correct: boolean; correctOptionId: string; explanation: string | null; explanationStatus: "approved" | "pending-review" };
type AttemptBody = { attempt?: Attempt; question?: Question | null; answers?: Answer[]; feedback?: Feedback; error?: string };

function key(topicId: string) { return `apoyo-diagnostic:${topicId}`; }
function params(selection: Selection) {
  return new URLSearchParams({ gradeId: selection.gradeId!, subjectId: selection.subjectId!, topicId: selection.topicId! });
}

export default function DiagnosticAccountAttempt({ selection, onExit }: { selection: Selection; onExit: () => void }) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [nextQuestion, setNextQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [optionId, setOptionId] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [studying, setStudying] = useState(false);
  const sending = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const topicId = selection.topicId!;

  async function load(id?: string) {
    const query = id ? new URLSearchParams({ attemptId: id }) : params(selection);
    const response = await fetch(`/api/diagnostic/attempt?${query}`, { cache: "no-store", credentials: "same-origin", signal: controller.current?.signal });
    const body = await response.json() as AttemptBody;
    if (!response.ok) throw Object.assign(new Error(body.error ?? "No se pudo recuperar el diagnóstico."), { status: response.status });
    if (!body.attempt) throw new Error("El servidor no devolvió el intento.");
    setAttempt(body.attempt);
    setQuestion(body.question ?? null);
    setAnswers(Array.isArray(body.answers) ? body.answers : []);
    setFeedback(null);
    setOptionId("");
    window.localStorage.setItem(key(topicId), body.attempt.id);
  }

  async function start() {
    const response = await fetch("/api/diagnostic/attempt/start", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", cache: "no-store",
      body: JSON.stringify({ gradeId: selection.gradeId, subjectId: selection.subjectId, topicId, mode: "demo" }),
      signal: controller.current?.signal,
    });
    const body = await response.json() as AttemptBody;
    if (!response.ok) throw new Error(body.error ?? "No se pudo iniciar el diagnóstico. Revisa si hay suficientes preguntas.");
    if (!body.attempt || !body.question) throw new Error("El servidor no devolvió una pregunta válida.");
    window.localStorage.setItem(key(topicId), body.attempt.id);
    setAttempt(body.attempt);
    setQuestion(body.question);
    setNextQuestion(null);
    setAnswers([]);
    setFeedback(null);
    setOptionId("");
    setNotice("Nuevo intento provisional guardado en tu cuenta.");
  }

  useEffect(() => {
    let live = true;
    controller.current = new AbortController();
    async function restore() {
      try {
        const saved = window.localStorage.getItem(key(topicId));
        if (saved) {
          try {
            await load(saved);
            if (live) setNotice("Intento recuperado desde el servidor.");
            return;
          } catch (cause) {
            if (!(cause instanceof Error && "status" in cause && cause.status === 404)) throw cause;
            window.localStorage.removeItem(key(topicId));
          }
        }
        try {
          await load();
          if (live) setNotice("Retomaste un intento abierto de este tema.");
        } catch (cause) {
          if (!(cause instanceof Error && "status" in cause && cause.status === 404)) throw cause;
          await start();
        }
      } catch (cause) {
        if (live && !controller.current?.signal.aborted) setError(cause instanceof Error ? cause.message : "No se pudo preparar el diagnóstico.");
      } finally { if (live) setBusy(false); }
    }
    void restore();
    return () => { live = false; controller.current?.abort(); };
    // El componente se monta de nuevo al cambiar la selección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  async function submit() {
    if (!attempt || !question || feedback || sending.current) return;
    if (!optionId) { setError("Selecciona una respuesta antes de continuar."); return; }
    sending.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/diagnostic/attempt/answer", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", cache: "no-store",
        body: JSON.stringify({ attemptId: attempt.id, questionId: question.id, optionId }),
      });
      const body = await response.json() as AttemptBody;
      if (!response.ok || !body.attempt || !body.feedback) {
        throw new Error(body.error ?? (response.status === 409 ? "Esta pregunta ya fue respondida. Actualiza el intento para continuar." : "No se pudo registrar la respuesta."));
      }
      setAttempt(body.attempt);
      setFeedback(body.feedback);
      setNextQuestion(body.question ?? null);
      setAnswers((current) => [...current, { questionId: question.id, optionId, correct: body.feedback!.correct, skill: question.skill }]);
      if (body.attempt.status === "completed") window.dispatchEvent(new Event("ap-progress-saved"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo registrar la respuesta.");
    } finally { sending.current = false; setBusy(false); }
  }

  async function advance() {
    if (!attempt) return;
    setFeedback(null); setOptionId(""); setError("");
    if (attempt.status === "completed") {
      setBusy(true);
      try { await load(attempt.id); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo cargar el resumen."); }
      finally { setBusy(false); }
    } else setQuestion(nextQuestion);
  }

  async function restart() {
    if (busy) return;
    setBusy(true); setError(""); setNotice(""); setStudying(false);
    try { await start(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo iniciar otro intento."); }
    finally { setBusy(false); }
  }

  if (studying) return <><StudyDemo selection={selection} accountMode /><button className="text-button" type="button" onClick={() => setStudying(false)}>Volver al diagnóstico guardado</button></>;

  const answeredQuestions: QuestionView[] = answers.map((answer) => ({ id: answer.questionId, prompt: "", options: [], skill: answer.skill }));
  const analysis = diagnosticSkillInsights(answeredQuestions, answers);
  return <div className="diagnostic-account-attempt">
    <h3>Diagnóstico de demostración en tu cuenta</h3>
    <p>Las preguntas y el resultado son provisionales. Tu intento y respuestas se guardan en tu cuenta; no son una calificación validada.</p>
    {notice && <p role="status">{notice}</p>}
    {busy && !attempt && <p role="status">Preparando o recuperando el intento…</p>}
    {attempt?.status === "open" && question && <div className="diagnostic-panel">
      <p className="question-progress" aria-live="polite">Pregunta {attempt.answered + (feedback ? 0 : 1)} de {attempt.total}</p>
      <progress value={attempt.answered + (feedback ? 0 : 1)} max={attempt.total} aria-label="Avance del diagnóstico" />
      <p>Nivel de esta pregunta: {question.difficulty ?? "inicial"}{question.fallback ? ". No había otra pregunta del nivel solicitado; se utilizó una disponible." : "."}</p>
      <h4>{question.prompt}</h4>
      <fieldset disabled={busy || feedback !== null}><legend>Elige una respuesta</legend>
        {question.options.map((option) => <label className="answer-option" key={option.id}><input type="radio" name={question.id} value={option.id} checked={optionId === option.id} onChange={() => { setOptionId(option.id); setError(""); }} />{option.text}</label>)}
      </fieldset>
      {!feedback && <button className="primary-button" type="button" onClick={submit} disabled={busy}>{busy ? "Guardando…" : "Revisar respuesta"}</button>}
      {feedback && <div className={`answer-feedback ${feedback.correct ? "correct" : "incorrect"}`} role="status">
        <strong>{feedback.correct ? "Respuesta correcta" : "Respuesta incorrecta"}</strong>
        <p>{feedback.explanationStatus === "pending-review" ? "Explicación pendiente de revisión docente." : feedback.explanation}</p>
        {!feedback.correct && <p>Respuesta de referencia: {question.options.find((option) => option.id === feedback.correctOptionId)?.text}.</p>}
        <button className="primary-button" type="button" onClick={advance}>Siguiente pregunta</button>
      </div>}
    </div>}
    {attempt?.status === "completed" && feedback && question && <div className={`answer-feedback ${feedback.correct ? "correct" : "incorrect"}`} role="status">
      <strong>{feedback.correct ? "Respuesta correcta" : "Respuesta incorrecta"}</strong>
      <p>{feedback.explanationStatus === "pending-review" ? "Explicación pendiente de revisión docente." : feedback.explanation}</p>
      {!feedback.correct && <p>Respuesta de referencia: {question.options.find((option) => option.id === feedback.correctOptionId)?.text}.</p>}
      <button className="primary-button" type="button" onClick={advance} disabled={busy}>{busy ? "Cargando resumen…" : "Ver resumen"}</button>
    </div>}
    {attempt?.status === "completed" && !feedback && <div className="diagnostic-panel" role="status">
      <h4>Terminaste la demostración</h4>
      <p>Respondiste {attempt.answered} de {attempt.total} preguntas; acertaste {attempt.correctCount}. Este resultado viene del intento guardado en el servidor.</p>
      {attempt.completionReason === "bank-exhausted" && <p>Se agotaron las preguntas disponibles para este diagnóstico. No se inventó otra pregunta ni un resultado adicional.</p>}
      <h4>Resultados por subtema</h4>
      <p>Regla provisional: se necesitan al menos {MIN_DIAGNOSTIC_SKILL_ANSWERS} respuestas del mismo subtema. El porcentaje de confianza describe cantidad y consistencia de respuestas de este intento; no mide probabilidad de dominio. Una mezcla equilibrada de aciertos y errores da 0 % y deja el resultado indeterminado.</p>
      {analysis.skills.length > 0 ? <ul className="skill-results">{analysis.skills.map((result) => <li key={result.skill}>
        <strong>{result.skill}</strong>: {result.strength ? "fortaleza observada (demo)" : result.status === "dificultad-demo" ? "señal de dificultad (demo)" : "indeterminado: evidencia insuficiente o resultado mixto"}. {result.correct}/{result.answered} aciertos. Confianza en la señal: {result.confidence === null ? "insuficiente por pocas respuestas" : `${result.confidence} % (${result.confidenceLevel})`}.
        {result.status === "dificultad-demo" && <ProvisionalExplanationPanel key={`${attempt.id}/${result.skill}`} selection={selection} subskillId={result.skill} />}
      </li>)}</ul> : <p>No hay respuestas por subtema para analizar.</p>}
      <h4>Fortalezas observadas</h4>
      {analysis.strengths.length > 0 ? <ul className="skill-strengths">{analysis.strengths.map((result) => <li key={result.skill}>{result.skill} · {result.correct}/{result.answered} aciertos · confianza {result.confidence} %</li>)}</ul>
        : <p>Aún no hay subtemas con al menos dos respuestas correctas de dos o más preguntas en este intento. Puedes seguir practicando y volver a evaluar el tema.</p>}
      <p>Este resumen usa solo las respuestas guardadas de este diagnóstico. No representa una tendencia entre sesiones ni una evaluación académica validada.</p>
      <button className="primary-button" type="button" onClick={() => setStudying(true)}>Continuar a estudiar</button>
      <button className="text-button" type="button" onClick={restart} disabled={busy}>Iniciar otro intento</button>
    </div>}
    {attempt?.status === "open" && !question && !feedback && !busy && <p role="alert">No hay una pregunta disponible para continuar. Recupera el intento o informa este error.</p>}
    {error && <p className="diagnostic-error" role="alert">{error} {attempt?.status === "open" && <button className="text-button" type="button" onClick={() => { setError(""); void load(attempt.id).catch(() => setError("No se pudo recuperar el intento.")); }}>Recuperar intento</button>}</p>}
    <button className="text-button" type="button" onClick={onExit}>Salir del diagnóstico</button>
  </div>;
}
