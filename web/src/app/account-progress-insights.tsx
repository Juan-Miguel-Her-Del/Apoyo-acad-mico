"use client";

import { useState } from "react";
import { grades, subjects, topics } from "@/lib/catalog";
import type { PracticeHistoryItem } from "@/lib/practice-history";
import { getPracticeSkills } from "@/lib/practice-skills";
import { MIN_SKILL_ANSWERS, MIN_COMPLETE_ATTEMPTS, skillInsight } from "@/lib/progress-insights";

function topicName(topicId: string) {
  const topic = topics.find((item) => item.id === topicId);
  if (!topic) return topicId;
  const grade = grades.find((item) => item.id === topic.gradeId)?.label ?? topic.gradeId;
  const subject = subjects.find((item) => item.id === topic.subjectId)?.name ?? topic.subjectId;
  return `${grade} · ${subject} · ${topic.name}`;
}

function dateName(value: string) {
  return new Date(value).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

const levels = {
  indeterminate: "Indeterminado",
  initial: "Inicial",
  developing: "En progreso",
  high: "Alto",
};

export default function AccountProgressInsights({ items }: { items: readonly PracticeHistoryItem[] }) {
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const available = topics.filter((item) => item.active && item.pilotCandidate);
  const defaultTopic = items.find((item) => item.status === "completed")?.topicId ?? available[0]?.id ?? "";
  const topicId = available.some((item) => item.id === selectedTopic) ? selectedTopic : defaultTopic;
  const skills = getPracticeSkills(topicId);
  const skillId = skills.some((item) => item.id === selectedSkill) ? selectedSkill : skills[0]?.id ?? "";
  const insight = skillInsight(items, topicId, skillId);

  return <section className="progress-insights" aria-labelledby="progress-insights-title">
    <h3 id="progress-insights-title">Dominio y evolución por subtema</h3>
    <p>Consulta las respuestas registradas en cada subtema. La estimación es solo para la demostración.</p>
    <label className="comparison-label">Tema
      <select value={topicId} onChange={(event) => setSelectedTopic(event.target.value)}>
        {available.map((item) => <option key={item.id} value={item.id}>{topicName(item.id)}</option>)}
      </select>
    </label>
    <p className="skill-overview-title">Estado de los subtemas de este tema:</p>
    <ul className="skill-overview">
      {skills.map((skill) => <li key={skill.id}><span>{skill.label}</span><strong>{levels[skillInsight(items, topicId, skill.id).level]}</strong></li>)}
    </ul>
    <label className="comparison-label">Subtema para ver el detalle
      <select value={skillId} onChange={(event) => setSelectedSkill(event.target.value)}>
        {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.label}</option>)}
      </select>
    </label>
    <div className="domain-summary" role="status">
      <strong>Estado: {levels[insight.level]}</strong>
      {insight.level === "indeterminate"
        ? <p>Faltan datos: se requieren al menos {MIN_COMPLETE_ATTEMPTS} prácticas completas y {MIN_SKILL_ANSWERS} respuestas de este subtema. Prácticas completas con respuestas: {insight.completeAttempts}. Respuestas registradas: {insight.answered}.</p>
        : <p>{insight.correct}/{insight.answered} respuestas correctas ({insight.observedPercent} %) en {insight.completeAttempts} prácticas completas. Regla orientativa: inicial &lt; 50 %, en progreso 50–79 %, alto ≥ 80 %.</p>}
    </div>
    <figure className="progress-figure" aria-labelledby="progress-chart-title">
      <figcaption id="progress-chart-title">Aciertos por intento terminado</figcaption>
      {insight.points.length === 0 ? <p>No hay prácticas terminadas con respuestas en este subtema.</p>
        : <>
          {insight.points.length === 1 && <p>Hay una sola medición; todavía no se puede mostrar una tendencia.</p>}
          <ol className="progress-bars">
            {insight.points.map((point, index) => <li key={point.id}>
              <span>Intento {index + 1} · {dateName(point.completedAt)}{point.complete ? "" : " · parcial"}</span>
              <span className="progress-bar-track" aria-hidden="true"><span style={{ width: `${point.percent}%` }} /></span>
              <strong>{point.correct}/{point.answered} · {point.percent} %</strong>
            </li>)}
          </ol>
          <p>Las barras muestran únicamente respuestas registradas en prácticas terminadas. Los intentos parciales se ven en la gráfica, pero no cuentan para estimar dominio.</p>
        </>}
    </figure>
    <p>Las preguntas y umbrales son provisionales; estos resultados no equivalen a una evaluación académica validada.</p>
  </section>;
}
