"use client";

import { useEffect, useState } from "react";
import type { Selection } from "@/lib/selection";
import { getStudyDemo, pickStudyChapter } from "@/lib/study-demo";

type ProvisionalContent = { explanation: string; example: string; topicId: string; subskillId: string; provisional: true };

export default function ProvisionalExplanationPanel({ selection, subskillId, canReport = false }: { selection: Selection; subskillId: string; canReport?: boolean }) {
  const [aiAvailable, setAiAvailable] = useState(false);
  const [content, setContent] = useState<ProvisionalContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("inaccurate");
  const [reportMessage, setReportMessage] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
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

  async function requestAiExplanation() {
    if (busy || !selection.gradeId || !selection.subjectId || !selection.topicId) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/explanation/provisional", {
        method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeId: selection.gradeId, subjectId: selection.subjectId, topicId: selection.topicId, subskillId }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "No pudimos cargar la explicación con IA.");
      if (body.provisional !== true || body.topicId !== selection.topicId || body.subskillId !== subskillId ||
          typeof body.explanation !== "string" || typeof body.example !== "string") throw new Error("La explicación recibida no es válida.");
      setContent(body as ProvisionalContent);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos cargar la explicación con IA."); }
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
          topicId: selection.topicId, subskillId, sourceVersion: "study-draft-v1", reason: reportReason }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "No se pudo enviar el reporte.");
      setContent(null);
      setAiAvailable(false);
      setReportOpen(false);
      setReportMessage(body.message);
    } catch (cause) { setReportMessage(cause instanceof Error ? cause.message : "No se pudo enviar el reporte."); }
    finally { setReportBusy(false); }
  }

  if (!chapter) return null;
  return <section className="provisional-explanation" aria-label={`Explicación de prueba de ${subskillId}`}>
    <h5>Explicación de prueba · {subskillId}</h5>
    <p className="content-status">Borrador sin revisión docente. Úsalo para practicar, no como evaluación definitiva.</p>
    <p>{content ? content.explanation : chapter.explanation}</p>
    <p><strong>Ejemplo:</strong> {content ? content.example : chapter.example}</p>
    {content && <p className="content-status">Gemini seleccionó estos fragmentos del borrador; no añadió información nueva.</p>}
    {aiAvailable && <button className="text-button" type="button" disabled={busy} onClick={() => void requestAiExplanation()}>
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
  </section>;
}
