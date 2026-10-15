"use client";

import { useEffect, useState } from "react";
import { isDemoGrade, type Grade, type GradeGroup, type Subject, type Topic } from "@/lib/catalog";
import { emptySelection, selectGrade, selectSubject, selectTopic, validSelection } from "@/lib/selection";
import DiagnosticDemo from "./diagnostic-demo";
import AccountPanel from "./account-panel";

type Result<T> = { key: string; status: "success" | "error"; items: T[] };
const groups: GradeGroup[] = ["Primaria", "Bachillerato"];

function useCatalogResource<T>(url: string | null) {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);
  const key = url ? `${url}|${retryCount}` : "";

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo cargar el catálogo.");
        const body: unknown = await response.json();
        if (!body || typeof body !== "object" || !("items" in body) || !Array.isArray(body.items)) {
          throw new Error("Respuesta del catálogo no válida.");
        }
        if (!controller.signal.aborted) setResult({ key, status: "success", items: body.items as T[] });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, status: "error", items: [] });
      });
    return () => controller.abort();
  }, [key, url]);

  return {
    items: result?.key === key && result.status === "success" ? result.items : [],
    status: !url ? "idle" : result?.key === key ? result.status : "loading",
    retry: () => setRetryCount((value) => value + 1),
  };
}

function LoadState({ status, retry, empty, error }: { status: string; retry: () => void; empty: string; error: string }) {
  if (status === "loading") return <p className="empty-state" role="status">Cargando opciones…</p>;
  if (status === "error") return <div className="empty-state" role="alert"><span>{error}</span><button type="button" className="retry-button" onClick={retry}>Reintentar</button></div>;
  return <p className="empty-state">{empty}</p>;
}

export default function Home() {
  const [selection, setSelection] = useState(emptySelection);
  const gradeResource = useCatalogResource<Grade>("/api/catalog?resource=grades");
  const subjectUrl = selection.gradeId
    ? `/api/catalog?resource=subjects&grade=${encodeURIComponent(selection.gradeId)}` : null;
  const subjectResource = useCatalogResource<Subject>(subjectUrl);
  const topicUrl = selection.gradeId && selection.subjectId
    ? `/api/catalog?resource=topics&grade=${encodeURIComponent(selection.gradeId)}&subject=${encodeURIComponent(selection.subjectId)}` : null;
  const topicResource = useCatalogResource<Topic>(topicUrl);

  const grades = gradeResource.items;
  const availableSubjects = subjectResource.items;
  const availableTopics = topicResource.items;
  const valid = validSelection(selection, grades, availableSubjects, availableTopics);
  const grade = grades.find((item) => item.id === valid.gradeId);
  const subject = availableSubjects.find((item) => item.id === valid.subjectId);
  const topic = availableTopics.find((item) => item.id === valid.topicId);

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
          <div className="prototype-note" role="note">Vista de prueba para 1.º a 11.º. El contenido es provisional y queda pendiente de revisión docente. Puedes probar diagnóstico, explicación y práctica al elegir un tema.</div>
        </div>
        <div className="hero-art" aria-hidden="true"><span>∑</span><span>A+</span><span>⚛</span></div>
      </section>

      <AccountPanel />

      <div className="flow-heading"><div><p className="eyebrow">Paso a paso</p><h2>Construye tu ruta de estudio</h2></div><span>01 — 03</span></div>

      <section className="step-card" aria-labelledby="grade-title">
        <div className="step-intro"><span className="step-number">01</span><div><h3 id="grade-title">¿En qué grado estás?</h3><p>Elige el grado que cursas actualmente.</p></div></div>
        {gradeResource.status !== "success" ? <LoadState status={gradeResource.status} retry={gradeResource.retry} empty="Aún no hay grados disponibles. Inténtalo más tarde." error="No se pudo cargar el catálogo. Inténtalo de nuevo." /> : grades.length === 0 ? <LoadState status="empty" retry={gradeResource.retry} empty="Aún no hay grados disponibles. Inténtalo más tarde." error="" /> : (
          <div className="grade-groups">
            {groups.map((group) => (
              <div className="grade-group" key={group}>
                <div className="group-heading"><span>{group}</span><span>{group === "Primaria" ? "1.º a 5.º" : "6.º a 11.º"}</span></div>
                <div className="grade-grid">
                  {grades.filter((item) => item.group === group).map((item) => {
                    const available = isDemoGrade(item.id);
                    return <button className={`grade-choice ${valid.gradeId === item.id ? "selected" : ""}`} type="button" key={item.id} disabled={!available} aria-pressed={valid.gradeId === item.id} onClick={() => setSelection((current) => selectGrade(current, item.id))}>
                      <strong>{item.label}</strong><span>{available ? "Disponible" : "Próximamente"}</span>
                    </button>;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="step-card" aria-labelledby="subject-title">
        <div className="step-intro"><span className="step-number">02</span><div><h3 id="subject-title">Elige una materia</h3><p>Verás las materias disponibles para tu grado.</p></div></div>
        {!grade ? <p className="empty-state">Selecciona un grado para ver sus materias.</p> : subjectResource.status !== "success" ? <LoadState status={subjectResource.status} retry={subjectResource.retry} empty="No hay materias disponibles para este grado." error="No pudimos cargar las materias. Inténtalo de nuevo." /> : availableSubjects.length === 0 ? <LoadState status="empty" retry={subjectResource.retry} empty="No hay materias disponibles para este grado." error="" /> : (
          <div className="subject-grid">
            {availableSubjects.map((item) => (
              <button className={`subject-choice ${valid.subjectId === item.id ? "selected" : ""}`} type="button" key={item.id} aria-pressed={valid.subjectId === item.id} onClick={() => setSelection((current) => selectSubject(current, item.id))}>
                <span className={`subject-icon subject-${item.id.toLowerCase()}`} aria-hidden="true">{item.id === "MAT" ? "∑" : item.id === "ESP" ? "Aa" : item.id === "FIS" ? "↗" : "⚗"}</span>
                <span>{item.name}</span><span className="choice-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="step-card" aria-labelledby="topic-title">
        <div className="step-intro"><span className="step-number">03</span><div><h3 id="topic-title">Selecciona un tema</h3><p>Elige lo que te gustaría repasar primero.</p></div></div>
        {!subject ? <p className="empty-state">Selecciona una materia para ver sus temas.</p> : topicResource.status !== "success" ? <LoadState status={topicResource.status} retry={topicResource.retry} empty="No hay temas disponibles para esta materia." error="No se pudo cargar el catálogo. Inténtalo de nuevo." /> : availableTopics.length === 0 ? <LoadState status="empty" retry={topicResource.retry} empty="No hay temas disponibles para esta materia." error="" /> : (
          <div className="topic-list">
            {availableTopics.map((item) => (
              <button className={`topic-choice ${valid.topicId === item.id ? "selected" : ""}`} type="button" key={item.id} aria-pressed={valid.topicId === item.id} onClick={() => setSelection((current) => selectTopic(current, item.id))}>
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
      <DiagnosticDemo key={`${valid.gradeId ?? ""}/${valid.subjectId ?? ""}/${valid.topicId ?? ""}`} selection={valid} />
      <footer className="site-footer"><span>Apoyo académico</span><span>Contenido provisional en revisión</span></footer>
    </main>
  );
}
