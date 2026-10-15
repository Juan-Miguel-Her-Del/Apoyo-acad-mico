"use client";

import { useState } from "react";
import { checkStudyAnswer, getStudyDemo } from "@/lib/study-demo";
import type { Selection } from "@/lib/selection";

type Attempt = { key: string; selectedIndex: number | null; checked: boolean };

export default function StudyDemo({ selection }: { selection: Selection }) {
  const [attempt, setAttempt] = useState<Attempt>({ key: "", selectedIndex: null, checked: false });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const lesson = selection.gradeId && selection.subjectId && selection.topicId
    ? getStudyDemo(selection.gradeId, selection.subjectId, selection.topicId) : null;
  const key = lesson?.topicId ?? "";
  const selectedIndex = attempt.key === key ? attempt.selectedIndex : null;
  const checked = attempt.key === key && attempt.checked;
  const result = lesson && selectedIndex !== null && checked ? checkStudyAnswer(lesson, selectedIndex) : null;

  async function saveProgress() {
    if (!lesson || !result || saving) return;
    setSaving(true);
    setSaveMessage("");
    try {
      const response = await fetch("/api/progress", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ gradeId: lesson.gradeId, subjectId: lesson.subjectId, topicId: lesson.topicId, kind: "study", completed: true }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? "Inicia sesión arriba para guardar esta práctica." : body.error ?? "No se pudo guardar la práctica.");
      setSaveMessage("Práctica guardada en tu cuenta. Puedes verla en «Progreso guardado».");
      window.dispatchEvent(new Event("ap-progress-saved"));
    } catch (cause) {
      setSaveMessage(cause instanceof Error ? cause.message : "No se pudo guardar la práctica.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="diagnostic-card" aria-labelledby="study-demo-title">
    <p className="eyebrow">Estudio y práctica · demostración</p>
    <h2 id="study-demo-title">Estudia un tema y ponlo en práctica</h2>
    <p className="diagnostic-disclaimer">Contenido provisional sin revisión docente. Sirve para mostrar cómo funcionará el estudio; no es una lección validada ni una calificación. Tu respuesta solo permanece en esta pantalla y no se guarda.</p>
    {!lesson ? <p className="empty-state">Elige un grado, una materia y un tema disponible para abrir esta demostración.</p> : <div className="diagnostic-panel">
      <h3>{lesson.title}</h3>
      <h4>Explicación breve</h4>
      <p>{lesson.explanation}</p>
      <h4>Ejemplo</h4>
      <p>{lesson.example}</p>
      <h4>Ahora practica</h4>
      <fieldset disabled={checked}>
        <legend>{lesson.question.prompt}</legend>
        {lesson.question.options.map((option, index) => <label className="answer-option" key={`${lesson.topicId}-${index}`}>
          <input type="radio" name={`study-${lesson.topicId}`} checked={selectedIndex === index} onChange={() => setAttempt({ key, selectedIndex: index, checked: false })} />
          {option}
        </label>)}
      </fieldset>
      {!checked && <button className="primary-button" type="button" disabled={selectedIndex === null} onClick={() => setAttempt({ key, selectedIndex, checked: true })}>Revisar respuesta</button>}
      {result && <div className={`answer-feedback ${result.correct ? "correct" : "incorrect"}`} role="status">
        <strong>{result.correct ? "¡Correcto!" : "Revisa el ejemplo y vuelve a intentarlo"}</strong>
        <p>{result.feedback}</p>
        {!result.correct && <p>Respuesta de referencia: {lesson.question.options[lesson.question.correctIndex]}.</p>}
        <button className="text-button" type="button" onClick={() => setAttempt({ key, selectedIndex: null, checked: false })}>Practicar de nuevo</button>
        <button className="primary-button" type="button" onClick={saveProgress} disabled={saving}>{saving ? "Guardando…" : "Guardar práctica en mi cuenta"}</button>
        {saveMessage && <p role="status">{saveMessage}</p>}
      </div>}
    </div>}
  </section>;
}
