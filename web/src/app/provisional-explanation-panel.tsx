"use client";

import { useEffect, useState } from "react";
import type { Selection } from "@/lib/selection";
import { getStudyDemo, pickStudyChapter } from "@/lib/study-demo";

type ProvisionalContent = { explanation: string; example: string; topicId: string; subskillId: string; provisional: true };

export default function ProvisionalExplanationPanel({ selection, subskillId }: { selection: Selection; subskillId: string }) {
  const [aiAvailable, setAiAvailable] = useState(false);
  const [content, setContent] = useState<ProvisionalContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
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
    {error && <p role="alert">{error} La explicación local sigue disponible.</p>}
  </section>;
}
