"use client";

import { useState } from "react";
import { checkStudyAnswer, getStudyDemo } from "@/lib/study-demo";
import type { Selection } from "@/lib/selection";
import ExplanationFollowup from "./explanation-followup";
import PracticeSession from "./practice-session";

type Attempt = { key: string; selectedIndex: number | null; checked: boolean };
type StudyScreen = "lesson" | "check" | "practice";

export default function StudyDemo({ selection, accountMode = false }: { selection: Selection; accountMode?: boolean }) {
  const [screen, setScreen] = useState<StudyScreen>("lesson");
  const [chapterIndex, setChapterIndex] = useState(0);
  const [attempt, setAttempt] = useState<Attempt>({ key: "", selectedIndex: null, checked: false });
  const lesson = selection.gradeId && selection.subjectId && selection.topicId
    ? getStudyDemo(selection.gradeId, selection.subjectId, selection.topicId) : null;
  const key = lesson?.topicId ?? "";
  const selectedIndex = attempt.key === key ? attempt.selectedIndex : null;
  const checked = attempt.key === key && attempt.checked;
  const result = lesson && selectedIndex !== null && checked ? checkStudyAnswer(lesson, selectedIndex) : null;
  const chapter = lesson?.chapters[chapterIndex];

  return <section className="diagnostic-card study-screen" aria-labelledby="study-demo-title">
    <p className="eyebrow">{screen === "lesson" ? "01 · Aprende" : screen === "check" ? "02 · Comprueba" : "03 · Practica"}</p>
    <h2 id="study-demo-title">{screen === "lesson" ? lesson?.title ?? "Prepara tu tema" : screen === "check" ? "Comprueba lo que entendiste" : "Practica a tu ritmo"}</h2>
    {!lesson ? <p className="empty-state">Elige un tema disponible para comenzar.</p> : <>
      {screen === "lesson" && chapter && <div className="lesson-content">
        <p className="content-status">Contenido provisional pendiente de revisión docente.</p>
        <p className="chapter-progress">Parte {chapterIndex + 1} de {lesson.chapters.length}</p>
        <h3>{chapter.title}</h3>
        <h4>Explicación</h4><p>{chapter.explanation}</p>
        <h4>Ejemplo</h4><p>{chapter.example}</p>
        <div className="screen-actions">
          {chapterIndex > 0 && <button className="text-button" type="button" onClick={() => setChapterIndex((current) => current - 1)}>Parte anterior</button>}
          {chapterIndex + 1 < lesson.chapters.length
            ? <button className="primary-button" type="button" onClick={() => setChapterIndex((current) => current + 1)}>Siguiente parte</button>
            : <button className="primary-button" type="button" onClick={() => setScreen("check")}>Comprobar lo aprendido</button>}
        </div>
      </div>}
      {screen === "check" && <div className="lesson-content">
        {accountMode ? <ExplanationFollowup key={`study-draft-v1:${lesson.topicId}`}
          explanationId={`study-draft-v1:${lesson.topicId}`}
          topicId={lesson.topicId}
          mode="demo"
          question={{
            id: `study-draft-v1:${lesson.topicId}:short-check`,
            explanationId: `study-draft-v1:${lesson.topicId}`,
            prompt: lesson.question.prompt,
            referenceAnswer: lesson.question.options[lesson.question.correctIndex],
            validation: "demo-unreviewed",
          }} /> : <div className="quick-practice">
          <p>Elige una respuesta para revisar el ejemplo. Esta prueba no se guarda.</p>
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
        </div>}
        <div className="screen-actions"><button className="text-button" type="button" onClick={() => setScreen("lesson")}>Volver a la explicación</button>
          {accountMode && <button className="primary-button" type="button" onClick={() => setScreen("practice")}>Ir a la práctica</button>}
        </div>
      </div>}
      {screen === "practice" && accountMode && <div className="lesson-content">
        <PracticeSession selection={selection} />
        <div className="screen-actions"><button className="text-button" type="button" onClick={() => setScreen("check")}>Volver a la comprobación</button></div>
      </div>}
    </>}
  </section>;
}
