"use client";

import { useEffect, useState } from "react";
import { grades, subjects, topics } from "@/lib/catalog";
import type { Selection } from "@/lib/selection";
import DiagnosticDemo from "./diagnostic-demo";

type SkillResult = { skill: string; answered: number; correct: number; strength: boolean };
type Result = { topicId: string; answered: number; correctCount: number; at: string; skills?: SkillResult[] };
type Profile = { id: string; label: string; gradeId: string; results: Result[] };
const storageKey = "apoyo-perfiles-ficticios-v1";

function loadProfiles(): Profile[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((item): item is Profile => item && typeof item === "object" &&
      typeof item.id === "string" && /^Perfil ficticio [1-8]$/.test(item.label) &&
      grades.some((grade) => grade.id === item.gradeId) && Array.isArray(item.results) &&
      item.results.every((result: Result) => result && typeof result === "object" &&
        topics.some((topic) => topic.id === result.topicId && topic.gradeId === item.gradeId) &&
        Number.isInteger(result.answered) && result.answered >= 0 && result.answered <= 4 &&
        Number.isInteger(result.correctCount) && result.correctCount >= 0 && result.correctCount <= result.answered &&
        typeof result.at === "string" && !Number.isNaN(Date.parse(result.at)) &&
        (result.skills === undefined || (Array.isArray(result.skills) && result.skills.every((skill) =>
          skill && typeof skill.skill === "string" && skill.skill.length > 0 && skill.skill.length <= 120 &&
          Number.isInteger(skill.answered) && skill.answered >= 0 && skill.answered <= result.answered &&
          Number.isInteger(skill.correct) && skill.correct >= 0 && skill.correct <= skill.answered &&
          typeof skill.strength === "boolean"))))).slice(0, 8);
  } catch { return []; }
}

export default function DemoStudentWorkspace({ onExit }: { onExit: () => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [selection, setSelection] = useState<Selection>({ gradeId: null, subjectId: null, topicId: null });
  const [view, setView] = useState<"study" | "progress" | "profile">("study");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => { setProfiles(loadProfiles()); setReady(true); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const profile = profiles.find((item) => item.id === selectedId);
  const grade = grades.find((item) => item.id === profile?.gradeId);
  const availableSubjects = subjects.filter((item) => item.active && grade && item.grades.includes(grade.number));
  const availableTopics = topics.filter((item) => item.active && item.pilotCandidate && item.gradeId === profile?.gradeId && item.subjectId === selection.subjectId);
  const currentTopic = availableTopics.find((item) => item.id === selection.topicId);
  const latestSkills = new Map<string, SkillResult & { topicId: string }>();
  for (const result of profile?.results ?? []) for (const skill of result.skills ?? []) {
    const key = `${result.topicId}/${skill.skill}`;
    if (!latestSkills.has(key)) latestSkills.set(key, { ...skill, topicId: result.topicId });
  }
  const observedStrengths = [...latestSkills.values()].filter((item) => item.strength);

  function persist(next: Profile[]) {
    setProfiles(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }
  function selectProfile(next: Profile) {
    setSelectedId(next.id);
    setSelection({ gradeId: next.gradeId, subjectId: null, topicId: null });
    setView("study");
  }
  function createProfile() {
    if (!grades.some((item) => item.id === gradeId) || profiles.length >= 8) return;
    const nextNumber = Array.from({ length: 8 }, (_, index) => index + 1).find((number) => !profiles.some((item) => item.label === `Perfil ficticio ${number}`)) ?? 1;
    const next: Profile = { id: crypto.randomUUID(), label: `Perfil ficticio ${nextNumber}`, gradeId, results: [] };
    persist([...profiles, next]);
    setGradeId("");
    selectProfile(next);
  }
  function recordResult(result: Omit<Result, "at">) {
    if (!profile || !topics.some((item) => item.id === result.topicId && item.gradeId === profile.gradeId)) return;
    persist(profiles.map((item) => item.id === profile.id
      ? { ...item, results: [{ ...result, at: new Date().toISOString() }, ...item.results].slice(0, 50) }
      : item));
  }
  function deleteProfile() {
    if (!profile) return;
    persist(profiles.filter((item) => item.id !== profile.id));
    setSelectedId("");
    setSelection({ gradeId: null, subjectId: null, topicId: null });
  }

  return <main className="app-shell demo-student-workspace">
    <header className="site-header"><div className="brand-mark" aria-hidden="true">A</div><div className="brand-copy"><strong>Apoyo académico</strong><span>Perfil ficticio de estudiante</span></div>
      {profile && <nav className="main-nav" aria-label="Navegación del perfil ficticio">
        <button type="button" aria-current={view === "study" ? "page" : undefined} onClick={() => setView("study")}>Estudiar</button>
        <button type="button" aria-current={view === "progress" ? "page" : undefined} onClick={() => setView("progress")}>Mi progreso</button>
        <button type="button" aria-current={view === "profile" ? "page" : undefined} onClick={() => setView("profile")}>Perfil</button>
      </nav>}
    </header>
    <p className="demo-student-notice" role="note">Modo de prueba con datos ficticios. No escribas nombres, correos ni información de menores reales. Los resultados quedan solo en este navegador y se pueden borrar.</p>
    {!ready ? <p role="status">Preparando perfiles de prueba…</p> : !profile ? <section className="step-card demo-profile-picker">
      <p className="eyebrow">Simulación local</p><h1>Perfiles ficticios de estudiantes</h1>
      <p>Crea un perfil con un grado y un alias automático. No necesita correo, contraseña ni autorización porque no representa a una persona real.</p>
      {profiles.length > 0 && <div className="demo-profile-list"><h2>Continuar con un perfil</h2>{profiles.map((item) => <button className="subject-choice" type="button" key={item.id} onClick={() => selectProfile(item)}>{item.label} · {grades.find((grade) => grade.id === item.gradeId)?.label}<span aria-hidden="true">→</span></button>)}</div>}
      {profiles.length < 8 && <div className="demo-create"><label>Grado del perfil ficticio<select value={gradeId} onChange={(event) => setGradeId(event.target.value)}><option value="">Elige un grado</option>{grades.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.group}</option>)}</select></label>
        <button className="primary-button" type="button" disabled={!gradeId} onClick={createProfile}>Crear perfil ficticio</button></div>}
      <button className="text-button" type="button" onClick={onExit}>← Volver al inicio</button>
    </section> : <>
      {view === "study" && <section className="demo-study-flow">
        <div className="flow-heading"><div><p className="eyebrow">{profile.label} · {grade?.label}</p><h1>¿Qué vas a estudiar?</h1></div></div>
        <nav className="route-steps route-steps-profile" aria-label="Pasos del perfil ficticio">
          <button type="button" className={!selection.subjectId ? "active" : ""} onClick={() => setSelection({ gradeId: profile.gradeId, subjectId: null, topicId: null })}>1. Materia <small>{subjects.find((item) => item.id === selection.subjectId)?.name ?? "Por elegir"}</small></button>
          <button type="button" className={selection.subjectId ? "active" : ""} disabled={!selection.subjectId} onClick={() => setSelection((current) => ({ ...current, topicId: null }))}>2. Tema <small>{currentTopic?.name ?? "Por elegir"}</small></button>
        </nav>
        {!selection.subjectId ? <div className="step-card"><h2>Elige una materia</h2><div className="subject-grid">{availableSubjects.map((item) => <button className="subject-choice" type="button" key={item.id} onClick={() => setSelection({ gradeId: profile.gradeId, subjectId: item.id, topicId: null })}>{item.name}<span aria-hidden="true">→</span></button>)}</div></div>
          : !currentTopic ? <div className="step-card"><h2>Elige un tema</h2><div className="topic-list">{availableTopics.map((item) => <button className="topic-choice" type="button" key={item.id} onClick={() => setSelection({ gradeId: profile.gradeId, subjectId: item.subjectId, topicId: item.id })}><strong>{item.name}</strong></button>)}</div></div>
            : <><section className="selection-summary"><div><p className="eyebrow">Tu selección</p><h2>{currentTopic.name}</h2><p>{grade?.label} · {subjects.find((item) => item.id === currentTopic.subjectId)?.name}</p></div></section>
              <DiagnosticDemo key={currentTopic.id} selection={selection} onDemoCompleted={recordResult} /></>}
      </section>}
      {view === "progress" && <section className="step-card demo-progress"><p className="eyebrow">{profile.label}</p><h1>Mi progreso de prueba</h1><p>Estos resultados son orientativos y existen solo en este navegador.</p>
        <h2>Fortalezas observadas en la prueba</h2>
        {observedStrengths.length ? <ul className="demo-strengths">{observedStrengths.map((item) => <li key={`${item.topicId}/${item.skill}`}><strong>{item.skill}</strong> · {topics.find((topic) => topic.id === item.topicId)?.name} · {item.correct}/{item.answered} aciertos</li>)}</ul>
          : <p>No hay fortalezas observadas todavía. Se necesitan al menos dos respuestas distintas del mismo subtema, ambas correctas, en un diagnóstico. Esto no significa que no sepas el tema.</p>}
        <p className="content-status">La señal es provisional y no demuestra dominio académico.</p>
        <h2>Diagnósticos terminados</h2>
        {profile.results.length ? <ul>{profile.results.map((item, index) => <li key={`${item.at}-${index}`}><strong>{topics.find((topic) => topic.id === item.topicId)?.name ?? "Tema"}</strong> · {item.correctCount}/{item.answered} respuestas correctas · {new Date(item.at).toLocaleDateString("es-CO")}</li>)}</ul> : <p>Aún no hay diagnósticos terminados en este perfil.</p>}
      </section>}
      {view === "profile" && <section className="step-card demo-profile-details"><p className="eyebrow">Simulación local</p><h1>{profile.label}</h1><p>Grado: <strong>{grade?.label}</strong>. Este perfil no tiene correo ni contraseña y no es una cuenta real de menor.</p>
        <button className="text-button" type="button" onClick={() => setSelectedId("")}>Cambiar de perfil</button>
        <button className="text-button" type="button" onClick={deleteProfile}>Borrar este perfil ficticio y sus resultados</button>
      </section>}
      <button className="text-button preview-exit" type="button" onClick={onExit}>← Salir del modo de prueba</button>
    </>}
  </main>;
}
