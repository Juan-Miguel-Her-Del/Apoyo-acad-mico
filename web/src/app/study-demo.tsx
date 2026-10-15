"use client";

import { useState } from "react";
import { checkStudyAnswer, getStudyDemo } from "@/lib/study-demo";
import type { Selection } from "@/lib/selection";
import ExplanationFollowup from "./explanation-followup";
import PracticeSession from "./practice-session";

type Attempt = { key: string; selectedIndex: number | null; checked: boolean };

export default function StudyDemo({ selection }: { selection: Selection }) {
  const [attempt, setAttempt] = useState<Attempt>({ key: "", selectedIndex: null, checked: false });
  const lesson = selection.gradeId && selection.subjectId && selection.topicId
    ? getStudyDemo(selection.gradeId, selection.subjectId, selection.topicId) : null;
  const key = lesson?.topicId ?? "";
  const selectedIndex = attempt.key === key ? attempt.selectedIndex : null;
  const checked = attempt.key === key && attempt.checked;
  const result = lesson && selectedIndex !== null && checked ? checkStudyAnswer(lesson, selectedIndex) : null;

  return <section className="diagnostic-card" aria-labelledby="study-demo-title">
    <p className="eyebrow">Estudio y práctica · demostración</p>
    <h2 id="study-demo-title">Estudia un tema y ponlo en práctica</h2>
    <p className="diagnostic-disclaimer">Contenido provisional sin revisión docente. Sirve para mostrar cómo funcionará el estudio; no es una lección validada ni una calificación académica. La prueba rápida no se guarda; la práctica con seguimiento sí se registra en tu cuenta de demostración.</p>
    {!lesson ? <p className="empty-state">Elige un grado, una materia y un tema disponible para abrir esta demostración.</p> : <div className="diagnostic-panel">
      <h3>{lesson.title}</h3>
      <h4>Explicación breve</h4>
      <p>{lesson.explanation}</p>
      <h4>Ejemplo</h4>
      <p>{lesson.example}</p>
      <ExplanationFollowup key={`study-draft-v1:${lesson.topicId}`}
        explanationId={`study-draft-v1:${lesson.topicId}`}
        mode="demo"
        question={{
          id: `study-draft-v1:${lesson.topicId}:short-check`,
          explanationId: `study-draft-v1:${lesson.topicId}`,
          prompt: lesson.question.prompt,
          referenceAnswer: lesson.question.options[lesson.question.correctIndex],
          validation: "demo-unreviewed",
        }} />
      <PracticeSession selection={selection} />
      <details className="quick-practice">
        <summary>Prueba rápida sin cuenta</summary>
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
        </div>}
      </details>
    </div>}
  </section>;
}
