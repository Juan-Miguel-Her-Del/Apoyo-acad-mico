"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Selection } from "@/lib/selection";

type Question = { id: string; prompt: string; options: { id: string; text: string }[] };
type Session = {
  id: string; topicId: string; status: "open" | "completed";
  total: number; answered: number; correctCount: number;
};
type Feedback = { correct: boolean; correctOptionId: string; explanation: string };
type SavedAnswer = { questionId: string; optionId: string; correct: boolean };

function storageKey(topicId: string) { return `apoyo-practice:${topicId}`; }

export default function PracticeSession({ selection }: { selection: Selection }) {
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<SavedAnswer[]>([]);
  const [index, setIndex] = useState(0);
  const [optionId, setOptionId] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sending = useRef(false);
  const topicId = selection.topicId ?? "";

  const restore = useCallback(async () => {
    if (!topicId) return;
    const id = window.localStorage.getItem(storageKey(topicId));
    if (!id) return;
    try {
      const response = await fetch(`/api/practice/session?sessionId=${encodeURIComponent(id)}`, {
        cache: "no-store", credentials: "same-origin",
      });
      if (response.status === 401 || response.status === 503) { setSession(null); setQuestions([]); setAnswers([]); return; }
      if (response.status === 404) { window.localStorage.removeItem(storageKey(topicId)); setSession(null); setQuestions([]); setAnswers([]); return; }
      const body = await response.json();
      if (!response.ok || !body.session || !Array.isArray(body.questions)) return;
      setSession(body.session);
      setQuestions(body.questions);
      setAnswers(Array.isArray(body.answers) ? body.answers : []);
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
      setSession(body.session); setQuestions(body.questions); setAnswers([]);
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
      setAnswers((current) => [...current, { questionId: question.id, optionId, correct: body.feedback.correct }]);
      if (body.session.status === "completed") window.dispatchEvent(new Event("ap-progress-saved"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo evaluar la respuesta.");
    } finally { sending.current = false; setBusy(false); }
  }

  const question = questions[index];
  return <div className="practice-session" aria-labelledby="practice-session-title">
    <h4 id="practice-session-title">Práctica con seguimiento</h4>
    <p>Dos preguntas de ejemplo sobre este tema. Con una cuenta de demostración, tus respuestas y el resultado quedan guardados para retomarlos.</p>
    {!session && <button className="primary-button" type="button" onClick={start} disabled={busy}>{busy ? "Preparando…" : "Empezar práctica de dos preguntas"}</button>}
    {session?.status === "open" && question && <div className="practice-question">
      <p className="question-progress">Pregunta {index + 1} de {session.total}</p>
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
        <p>{feedback.explanation}</p>
        {!feedback.correct && <p>Respuesta de referencia: {question.options.find((option) => option.id === feedback.correctOptionId)?.text}.</p>}
        <button className="primary-button" type="button" onClick={() => { setIndex(index + 1); setOptionId(""); setFeedback(null); }}>Siguiente pregunta</button>
      </div>}
    </div>}
    {session?.status === "completed" && feedback && question && <div className={`answer-feedback ${feedback.correct ? "correct" : "incorrect"}`} role="status">
      <strong>{feedback.correct ? "Respuesta correcta" : "Respuesta incorrecta"}</strong>
      <p>{feedback.explanation}</p>
      {!feedback.correct && <p>Respuesta de referencia: {question.options.find((option) => option.id === feedback.correctOptionId)?.text}.</p>}
      <button className="primary-button" type="button" onClick={() => setFeedback(null)}>Ver resultado</button>
    </div>}
    {session?.status === "completed" && !feedback && <div className="practice-result" role="status">
      <strong>Práctica completada: {session.correctCount} de {session.total} respuestas correctas.</strong>
      <p>Resultado de demostración guardado en tu cuenta. Puedes consultar el historial arriba.</p>
      {answers.length > 0 && <p>Respuestas registradas: {answers.length}.</p>}
      <button className="text-button" type="button" onClick={start} disabled={busy}>Intentar otra vez</button>
    </div>}
    {error && <p className="diagnostic-error" role="alert">{error}</p>}
  </div>;
}
