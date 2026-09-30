"use client";

import { useState } from "react";
import {
  getDemoSubjects,
  getDemoTopics,
  grades,
  isDemoGrade,
  type GradeGroup,
  type SubjectId,
} from "@/lib/catalog";

const groups: GradeGroup[] = ["Primaria", "Bachillerato"];

export default function Home() {
  const [gradeId, setGradeId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<SubjectId | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);

  const grade = grades.find((item) => item.id === gradeId);
  const availableSubjects = gradeId ? getDemoSubjects(gradeId) : [];
  const availableTopics = gradeId && subjectId ? getDemoTopics(gradeId, subjectId) : [];
  const subject = availableSubjects.find((item) => item.id === subjectId);
  const topic = availableTopics.find((item) => item.id === topicId);

  function selectGrade(nextGradeId: string) {
    setGradeId(nextGradeId);
    setSubjectId(null);
    setTopicId(null);
  }

  function selectSubject(nextSubjectId: SubjectId) {
    setSubjectId(nextSubjectId);
    setTopicId(null);
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <div className="brand-mark" aria-hidden="true">A</div>
        <div className="brand-copy"><strong>Apoyo académico</strong><span>Aprender a tu ritmo</span></div>
        <span className="header-label">Explora tu ruta</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <p className="eyebrow">Tu punto de partida</p>
          <h1 id="hero-title">Encuentra el tema que quieres estudiar.</h1>
          <p className="hero-description">Elige tu grado, después una materia y un tema. Así podremos preparar una experiencia que corresponda a lo que estudias.</p>
          <div className="prototype-note" role="note">Vista de prueba. Los temas del piloto están pendientes de revisión docente y aún no incluyen diagnóstico.</div>
        </div>
        <div className="hero-art" aria-hidden="true"><span>∑</span><span>A+</span><span>⚛</span></div>
      </section>

      <div className="flow-heading"><div><p className="eyebrow">Paso a paso</p><h2>Construye tu ruta de estudio</h2></div><span>01 — 03</span></div>

      <section className="step-card" aria-labelledby="grade-title">
        <div className="step-intro"><span className="step-number">01</span><div><h3 id="grade-title">¿En qué grado estás?</h3><p>Elige el grado que cursas actualmente.</p></div></div>
        <div className="grade-groups">
          {groups.map((group) => (
            <div className="grade-group" key={group}>
              <div className="group-heading"><span>{group}</span><span>{group === "Primaria" ? "1.º a 5.º" : "6.º a 11.º"}</span></div>
              <div className="grade-grid">
                {grades.filter((item) => item.group === group).map((item) => {
                  const available = isDemoGrade(item.id);
                  return (
                    <button className={`grade-choice ${gradeId === item.id ? "selected" : ""}`} type="button" key={item.id} disabled={!available} aria-pressed={gradeId === item.id} onClick={() => selectGrade(item.id)}>
                      <strong>{item.label}</strong><span>{available ? "Disponible" : "Próximamente"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="step-card" aria-labelledby="subject-title">
        <div className="step-intro"><span className="step-number">02</span><div><h3 id="subject-title">Elige una materia</h3><p>Verás las materias disponibles para tu grado.</p></div></div>
        {!grade ? <p className="empty-state">Selecciona un grado para ver sus materias.</p> : availableSubjects.length === 0 ? <p className="empty-state">Contenido próximamente para este grado.</p> : (
          <div className="subject-grid">
            {availableSubjects.map((item) => (
              <button className={`subject-choice ${subjectId === item.id ? "selected" : ""}`} type="button" key={item.id} aria-pressed={subjectId === item.id} onClick={() => selectSubject(item.id)}>
                <span className={`subject-icon subject-${item.id.toLowerCase()}`} aria-hidden="true">{item.id === "MAT" ? "∑" : item.id === "ESP" ? "Aa" : item.id === "FIS" ? "↗" : "⚗"}</span>
                <span>{item.name}</span><span className="choice-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="step-card" aria-labelledby="topic-title">
        <div className="step-intro"><span className="step-number">03</span><div><h3 id="topic-title">Selecciona un tema</h3><p>Elige lo que te gustaría repasar primero.</p></div></div>
        {!subject ? <p className="empty-state">Selecciona una materia para ver sus temas.</p> : availableTopics.length === 0 ? <p className="empty-state">No hay temas disponibles para esta materia.</p> : (
          <div className="topic-list">
            {availableTopics.map((item) => (
              <button className={`topic-choice ${topicId === item.id ? "selected" : ""}`} type="button" key={item.id} aria-pressed={topicId === item.id} onClick={() => setTopicId(item.id)}>
                <span className="radio-indicator" aria-hidden="true" /><span><strong>{item.name}</strong><small>{item.dba}</small></span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="selection-summary" aria-live="polite">
        <div><p className="eyebrow">Tu selección</p><h2>{topic ? "Tu ruta está preparada" : "Tu ruta aparecerá aquí"}</h2><p>{topic && grade && subject ? `${grade.label} · ${subject.name} · ${topic.name}` : "Completa los tres pasos para ver el tema elegido."}</p></div>
        <span aria-hidden="true">✦</span>
      </section>
      <footer className="site-footer"><span>Apoyo académico</span><span>Contenido del piloto en revisión</span></footer>
    </main>
  );
}
