"use client";

import { useEffect, useState } from "react";
import type { Selection } from "@/lib/selection";
import { getStudyDemo, pickStudyChapter } from "@/lib/study-demo";
import { demoExplanationId } from "@/lib/explanation-id";
import ExplanationFollowup from "./explanation-followup";

type ProvisionalContent = { explanation: string; example: string; topicId: string; subskillId: string;
  exampleIndex: number; hasAnotherExample: boolean; provisional: true; correction: string; sourceVersion: string };

export default function ProvisionalExplanationPanel({ selection, subskillId, attemptId, canReport = false }: { selection: Selection; subskillId: string; attemptId?: string; canReport?: boolean }) {
  const [aiAvailable, setAiAvailable] = useState(false);
  const [content, setContent] = useState<ProvisionalContent | null>(null);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [alternativeNotice, setAlternativeNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("inaccurate");
  const [reportMessage, setReportMessage] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [writingDraft, setWritingDraft] = useState("");
  const [writingChecks, setWritingChecks] = useState([false, false, false]);
  const lesson = selection.gradeId && selection.subjectId && selection.topicId
    ? getStudyDemo(selection.gradeId, selection.subjectId, selection.topicId) : null;
  const chapter = lesson ? pickStudyChapter(lesson, subskillId) : null;

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/explanation/provisional", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json()).then((body) => { if (!controller.signal.aborted) setAiAvailable(body.available === true); })
      .catch(() => { if (!controller.signal.aborted) setAiAvailable(false); });
    return () => controller.abort();
  }, []);

  async function requestAiExplanation(nextExampleIndex = exampleIndex) {
    if (busy || !attemptId || !selection.gradeId || !selection.subjectId || !selection.topicId) return;
    setBusy(true); setError(""); setAlternativeNotice(""); setExampleIndex(nextExampleIndex);
    try {
      const response = await fetch("/api/explanation/provisional", {
        method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeId: selection.gradeId, subjectId: selection.subjectId,
          topicId: selection.topicId, subskillId, attemptId, exampleIndex: nextExampleIndex }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "No pudimos cargar la explicación con IA.");
      if (body.provisional !== true || body.topicId !== selection.topicId || body.subskillId !== subskillId ||
          body.exampleIndex !== nextExampleIndex ||
          typeof body.explanation !== "string" || typeof body.example !== "string" ||
          typeof body.correction !== "string") throw new Error("La explicación recibida no es válida.");
      setContent(body as ProvisionalContent);
    } catch (cause) { setContent(null); setError(cause instanceof Error ? cause.message : "No pudimos cargar la explicación con IA."); }
    finally { setBusy(false); }
  }

  async function reportExplanation() {
    if (!content || !selection.gradeId || !selection.subjectId || !selection.topicId || reportBusy) return;
    setReportBusy(true); setReportMessage("");
    try {
      const response = await fetch("/api/explanation/report", {
        method: "POST", cache: "no-store", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeId: selection.gradeId, subjectId: selection.subjectId,
          topicId: selection.topicId, subskillId, exampleIndex,
          sourceVersion: content.sourceVersion, reason: reportReason }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "No se pudo enviar el reporte.");
      setContent(null);
      setExampleIndex(0);
      setAiAvailable(false);
      setReportOpen(false);
      setReportMessage(body.message);
    } catch (cause) { setReportMessage(cause instanceof Error ? cause.message : "No se pudo enviar el reporte."); }
    finally { setReportBusy(false); }
  }

  if (!chapter) return null;
  const localExample = exampleIndex === 1 && chapter.alternateExample ? chapter.alternateExample : chapter.example;
  const explanationId = selection.topicId ? demoExplanationId(selection.topicId, subskillId, exampleIndex) : "";
  return <section className="provisional-explanation" aria-label={`Explicación de prueba de ${subskillId}`}>
    <h5>Explicación de prueba · {subskillId}</h5>
    <p className="content-status">Borrador sin revisión docente. Úsalo para practicar, no como evaluación definitiva.</p>
    <p>{content ? content.explanation : chapter.explanation}</p>
    {content?.correction && <p><strong>Sobre tu respuesta:</strong> {content.correction}</p>}
    <p><strong>{exampleIndex === 0 ? "Ejemplo" : "Otro ejemplo"}:</strong> {content ? content.example : localExample}</p>
    {selection.topicId === "G05-ESP" && <div className="diagnostic-panel">
      <h5>Actividad de escritura</h5>
      <p>Escribe un título y al menos dos oraciones para informar a otros estudiantes sobre la lluvia. Consulta una fuente antes de afirmar cómo se forma.</p>
      <label>Tu borrador<textarea value={writingDraft} maxLength={1500} onChange={(event) => setWritingDraft(event.target.value)} /></label>
      <p>Revisa tu texto con estas casillas. Son una guía personal, no una calificación automática.</p>
      {["Mi título indica el tema y pensé en quién leerá el texto.",
        "Mis oraciones presentan datos ordenados e indico la fuente consultada.",
        "Revisé puntuación, ortografía y que el texto se entienda."].map((label, index) =>
        <label key={label}><input type="checkbox" checked={writingChecks[index]}
          onChange={(event) => setWritingChecks((current) => current.map((value, position) => position === index ? event.target.checked : value))} /> {label}</label>)}
      {writingDraft.trim() && writingChecks.every(Boolean) && <p role="status">Terminaste tu revisión personal. Comparte el texto con alguien para recibir observaciones.</p>}
    </div>}
    {exampleIndex === 0 ? <button className="text-button" type="button" disabled={busy} onClick={() => {
      if (!chapter.alternateExample) { setAlternativeNotice("No hay otro ejemplo disponible para este subtema."); return; }
      setContent(null); setExampleIndex(1); setAlternativeNotice(""); setError("");
      if (content && aiAvailable) void requestAiExplanation(1);
    }}>Ver otro ejemplo</button> : <button className="text-button" type="button" disabled={busy} onClick={() => {
      setContent(null); setExampleIndex(0); setAlternativeNotice(""); setError("");
    }}>Volver al primer ejemplo</button>}
    {alternativeNotice && <p role="status">{alternativeNotice}</p>}
    {content && <p className="content-status">Gemini seleccionó estos fragmentos del borrador; no añadió información nueva.</p>}
    {aiAvailable && attemptId && <button className="text-button" type="button" disabled={busy} onClick={() => void requestAiExplanation(exampleIndex)}>
      {busy ? "Buscando explicación…" : content ? "Volver a consultar Gemini" : "Ver una versión breve con Gemini"}
    </button>}
    {content && canReport && <div>
      <button className="text-button" type="button" aria-expanded={reportOpen} onClick={() => setReportOpen((current) => !current)}>Reportar un problema con esta respuesta</button>
      {reportOpen && <div><label>Tipo de problema
        <select value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
          <option value="inaccurate">Información incorrecta</option>
          <option value="confusing">Explicación confusa</option>
          <option value="inappropriate">Contenido inapropiado</option>
        </select></label>
        <button className="text-button" type="button" disabled={reportBusy} onClick={() => void reportExplanation()}>Enviar reporte y ocultar respuesta</button>
      </div>}
    </div>}
    {reportMessage && <p role="status">{reportMessage}</p>}
    {error && <p role="alert">{error} La explicación local sigue disponible.</p>}
    {selection.topicId && <ExplanationFollowup key={explanationId}
      explanationId={explanationId} topicId={selection.topicId} mode="demo"
      question={chapter.shortCheck ? { id: `${explanationId}:check`, explanationId,
        prompt: chapter.shortCheck.prompt, referenceAnswer: chapter.shortCheck.referenceAnswer,
        validation: "demo-unreviewed" } : null}
      showCheck={!!chapter.shortCheck} />}
  </section>;
}
