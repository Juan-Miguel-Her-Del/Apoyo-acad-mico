"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isDemoGrade, topics, type Grade, type GradeGroup, type Subject, type Topic } from "@/lib/catalog";
import { emptySelection, selectGrade, selectSubject, selectTopic, validSelection } from "@/lib/selection";
import DiagnosticDemo from "./diagnostic-demo";
import AccountPanel from "./account-panel";
import DemoStudentWorkspace from "./demo-student-workspace";

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
  const [accountId, setAccountId] = useState<string | null>(null);
  const [profileGradeId, setProfileGradeId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [demoMinorOpen, setDemoMinorOpen] = useState(false);
  const [welcomeNotice, setWelcomeNotice] = useState("");
  const [selectionNotice, setSelectionNotice] = useState("");
  const [view, setView] = useState<"study" | "progress" | "account">("study");
  const [step, setStep] = useState<"grade" | "subject" | "topic" | "ready">("grade");
  const selectionRevision = useRef(0);
  const profileGradeRef = useRef<string | null>(null);
  const navigate = useCallback((next: "study" | "progress" | "account") => {
    setView(next);
    window.location.hash = next === "study" ? "estudiar" : next === "progress" ? "progreso" : "cuenta";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  function changeSelection(next: Parameters<typeof setSelection>[0]) {
    selectionRevision.current += 1;
    setSelectionNotice("");
    setSelection(next);
  }
  useEffect(() => {
    const syncView = () => {
      const hash = window.location.hash;
      setView(hash === "#progreso" ? "progress" : hash === "#cuenta" ? "account" : "study");
    };
    syncView();
    window.addEventListener("hashchange", syncView);
    return () => window.removeEventListener("hashchange", syncView);
  }, []);
  useEffect(() => {
    let alive = true;
    async function restore() {
      const revision = selectionRevision.current;
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" });
        const body = me.ok ? await me.json() : null;
        if (!alive) return;
        const id = typeof body?.user?.id === "string" ? body.user.id : null;
        setAccountId(id);
        if (!id) return;
        const profileResponse = await fetch("/api/profile", { cache: "no-store", credentials: "same-origin" });
        if (!profileResponse.ok) return;
        const profileBody = await profileResponse.json();
        if (!alive || revision !== selectionRevision.current) return;
        const gradeId = typeof profileBody.profile?.gradeId === "string" ? profileBody.profile.gradeId : null;
        profileGradeRef.current = gradeId;
        setProfileGradeId(gradeId);
        if (!gradeId) { setStep("subject"); return; }
        const response = await fetch("/api/selection", { cache: "no-store", credentials: "same-origin" });
        if (!response.ok) return;
        const saved = await response.json();
        if (!alive || revision !== selectionRevision.current) return;
        if (saved.selection?.gradeId === gradeId) { setSelection(saved.selection); setStep("ready"); }
        else {
          if (saved.unavailable) setSelectionNotice("Tu último tema ya no está disponible. Elige otro.");
          setSelection({ gradeId, subjectId: null, topicId: null });
          setStep("subject");
        }
      } catch { /* La vista previa sigue disponible sin cuenta. */ }
      finally { if (alive) setAuthChecked(true); }
    }
    const onAuth = () => {
      selectionRevision.current += 1;
      profileGradeRef.current = null;
      setSelection(emptySelection); setStep("grade"); setAccountId(null); setProfileGradeId(null); setAuthChecked(false); setPreviewOpen(false);
      if (window.sessionStorage.getItem("ap-account-deleted") === "1") {
        window.sessionStorage.removeItem("ap-account-deleted");
        setWelcomeNotice("Tu cuenta y sus datos guardados fueron eliminados.");
      }
      void restore();
    };
    const onSuggested = (event: Event) => {
      const topicId = (event as CustomEvent<{ topicId: string }>).detail?.topicId;
      const topic = topics.find((item) => item.id === topicId && item.active && item.pilotCandidate);
      if (topic && topic.gradeId === profileGradeRef.current) {
        changeSelection({ gradeId: topic.gradeId, subjectId: topic.subjectId, topicId: topic.id });
        setStep("ready");
        navigate("study");
      }
    };
    void restore();
    window.addEventListener("ap-auth-changed", onAuth);
    window.addEventListener("ap-select-topic", onSuggested);
    return () => { alive = false; window.removeEventListener("ap-auth-changed", onAuth);
      window.removeEventListener("ap-select-topic", onSuggested); };
  }, [navigate]);
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
  useEffect(() => {
    if (!accountId || !valid.topicId) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/selection", { method: "PUT", credentials: "same-origin", signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeId: valid.gradeId, subjectId: valid.subjectId, topicId: valid.topicId }) });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [accountId, valid.gradeId, valid.subjectId, valid.topicId]);
  const grade = grades.find((item) => item.id === valid.gradeId);
  const subject = availableSubjects.find((item) => item.id === valid.subjectId);
  const topic = availableTopics.find((item) => item.id === valid.topicId);

  if (!authChecked) return <main className="app-shell"><div className="welcome-loading" role="status">Preparando Apoyo académico…</div></main>;
  if (demoMinorOpen && !accountId) return <DemoStudentWorkspace onExit={() => { setDemoMinorOpen(false); navigate("study"); }} />;
  if (!accountId && !previewOpen) return <main className="app-shell">
    <header className="site-header"><div className="brand-mark" aria-hidden="true">A</div>
      <div className="brand-copy"><strong>Apoyo académico</strong><span>Aprender a tu ritmo</span></div></header>
    {welcomeNotice && <p className="welcome-notice" role="status">{welcomeNotice}</p>}
    <div className="welcome-layout"><section className="welcome-intro" aria-labelledby="welcome-title">
      <p className="eyebrow">Tu espacio de aprendizaje</p>
      <h1 id="welcome-title">Estudia a tu ritmo, desde tu grado.</h1>
      <p>Elige el grado que cursas o preparas, estudia un tema y conserva tus avances en un mismo lugar.</p>
      <ul><li>Diagnósticos breves para orientar tu práctica.</li><li>Temas de Matemáticas y Español de 1.º a 11.º, y Física y Química en 10.º y 11.º.</li><li>Tu progreso queda ligado a tu cuenta.</li></ul>
      <p className="welcome-note">El contenido académico es provisional y está pendiente de revisión docente.</p>
      <button className="text-button" type="button" onClick={() => setPreviewOpen(true)}>Explorar una vista previa sin cuenta</button>
    </section><AccountPanel section="account" onOpenAccount={() => {}} onProfileSaved={() => {}} onOpenDemoMinor={() => setDemoMinorOpen(true)} compact /></div>
    <footer className="site-footer"><span>Apoyo académico · Colombia</span><span>Registro de menores aún no disponible</span></footer>
  </main>;

  return (
    <main className="app-shell">
      <header className="site-header">
        <div className="brand-mark" aria-hidden="true">A</div>
        <div className="brand-copy"><strong>Apoyo académico</strong><span>Aprender a tu ritmo</span></div>
        <nav className="main-nav" aria-label="Navegación principal">
          <button type="button" aria-current={view === "study" ? "page" : undefined} onClick={() => navigate("study")}>Estudiar</button>
          <button type="button" aria-current={view === "progress" ? "page" : undefined} onClick={() => navigate("progress")}>Mi progreso</button>
          <button type="button" aria-current={view === "account" ? "page" : undefined} onClick={() => navigate("account")}>Cuenta</button>
        </nav>
      </header>
      {!accountId && <button className="text-button preview-exit" type="button" onClick={() => { setPreviewOpen(false); changeSelection(emptySelection); setStep("grade"); navigate("study"); }}>← Volver al inicio</button>}

      <div hidden={view !== "study"}>
      {step !== "ready" && <section className="hero compact-hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <p className="eyebrow">Tu espacio de aprendizaje</p>
          <h1 id="hero-title">Un tema a la vez, a tu ritmo.</h1>
          <p className="hero-description">{accountId ? "Estudia las materias y temas de tu grado. Después podrás hacer un diagnóstico corto y practicar." : "Escoge tu grado, materia y tema. Después podrás hacer un diagnóstico corto y practicar."}</p>
        </div>
        <div className="hero-art" aria-hidden="true"><span>∑</span><span>A+</span><span>⚛</span></div>
      </section>}

      {step !== "ready" && <div className="flow-heading"><div><p className="eyebrow">Tu ruta</p><h2>Elige qué estudiar</h2></div><span>{accountId ? `${step === "subject" ? "01" : "02"} / 02` : `${step === "grade" ? "01" : step === "subject" ? "02" : "03"} / 03`}</span></div>}
      {accountId && step !== "ready" && <div className="profile-grade-banner"><span>Tu grado: <strong>{grade?.label ?? "Pendiente de configurar"}</strong></span><button className="text-button" type="button" onClick={() => navigate("account")}>Cambiar en mi perfil</button></div>}
      {accountId && !profileGradeId && <div className="profile-reminder"><strong>Completa tu perfil para estudiar</strong><p>Elige el grado que cursas o preparas en tu cuenta.</p><button className="text-button" type="button" onClick={() => navigate("account")}>Ir a mi perfil</button></div>}
      <nav className={`route-steps${accountId ? " route-steps-profile" : ""}${step === "ready" ? " route-steps-ready" : ""}`} aria-label="Pasos de tu ruta">
        {!accountId && <button type="button" className={step === "grade" ? "active" : ""} onClick={() => setStep("grade")}>1. Grado <small>{grade?.label ?? "Por elegir"}</small></button>}
        <button type="button" className={step === "subject" ? "active" : ""} disabled={!grade} onClick={() => setStep("subject")}>{accountId ? "1" : "2"}. Materia <small>{subject?.name ?? "Por elegir"}</small></button>
        <button type="button" className={step === "topic" || step === "ready" ? "active" : ""} disabled={!subject} onClick={() => setStep("topic")}>{accountId ? "2" : "3"}. Tema <small>{topic?.name ?? "Por elegir"}</small></button>
      </nav>
      {selectionNotice && <p className="selection-notice" role="status">{selectionNotice}</p>}

      {step === "grade" && !accountId && <section className="step-card" aria-labelledby="grade-title">
        <div className="step-intro"><span className="step-number">01</span><div><h3 id="grade-title">¿En qué grado estás?</h3><p>Elige el grado que cursas actualmente.</p></div></div>
        {gradeResource.status !== "success" ? <LoadState status={gradeResource.status} retry={gradeResource.retry} empty="Aún no hay grados disponibles. Inténtalo más tarde." error="No se pudo cargar el catálogo. Inténtalo de nuevo." /> : grades.length === 0 ? <LoadState status="empty" retry={gradeResource.retry} empty="Aún no hay grados disponibles. Inténtalo más tarde." error="" /> : (
          <div className="grade-groups">
            {groups.map((group) => (
              <div className="grade-group" key={group}>
                <div className="group-heading"><span>{group}</span><span>{group === "Primaria" ? "1.º a 5.º" : "6.º a 11.º"}</span></div>
                <div className="grade-grid">
                  {grades.filter((item) => item.group === group).map((item) => {
                    const available = isDemoGrade(item.id);
                    return <button className={`grade-choice ${valid.gradeId === item.id ? "selected" : ""}`} type="button" key={item.id} disabled={!available} aria-pressed={valid.gradeId === item.id} onClick={() => { changeSelection((current) => selectGrade(current, item.id)); setStep("subject"); }}>
                      <strong>{item.label}</strong><span>{available ? "Disponible" : "Próximamente"}</span>
                    </button>;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>}

      {step === "subject" && <section className="step-card" aria-labelledby="subject-title">
        <div className="step-intro"><span className="step-number">{accountId ? "01" : "02"}</span><div><h3 id="subject-title">Elige una materia</h3><p>Verás las materias disponibles para tu grado.</p></div></div>
        {!grade ? !accountId && <p className="empty-state">Selecciona un grado para ver sus materias.</p> : subjectResource.status !== "success" ? <LoadState status={subjectResource.status} retry={subjectResource.retry} empty="No hay materias disponibles para este grado." error="No pudimos cargar las materias. Inténtalo de nuevo." /> : availableSubjects.length === 0 ? <LoadState status="empty" retry={subjectResource.retry} empty="No hay materias disponibles para este grado." error="" /> : (
          <div className="subject-grid">
            {availableSubjects.map((item) => (
              <button className={`subject-choice ${valid.subjectId === item.id ? "selected" : ""}`} type="button" key={item.id} aria-pressed={valid.subjectId === item.id} onClick={() => { changeSelection((current) => selectSubject(current, item.id)); setStep("topic"); }}>
                <span className={`subject-icon subject-${item.id.toLowerCase()}`} aria-hidden="true">{item.id === "MAT" ? "∑" : item.id === "ESP" ? "Aa" : item.id === "FIS" ? "↗" : "⚗"}</span>
                <span>{item.name}</span><span className="choice-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        )}
      </section>}

      {step === "topic" && <section className="step-card" aria-labelledby="topic-title">
        <div className="step-intro"><span className="step-number">{accountId ? "02" : "03"}</span><div><h3 id="topic-title">Selecciona un tema</h3><p>Elige lo que te gustaría repasar primero.</p></div></div>
        {!subject ? <p className="empty-state">Selecciona una materia para ver sus temas.</p> : topicResource.status !== "success" ? <LoadState status={topicResource.status} retry={topicResource.retry} empty="No hay temas disponibles para esta materia." error="No se pudo cargar el catálogo. Inténtalo de nuevo." /> : availableTopics.length === 0 ? <LoadState status="empty" retry={topicResource.retry} empty="No hay temas disponibles para esta materia." error="" /> : (
          <div className="topic-list">
            {availableTopics.map((item) => (
              <button className={`topic-choice ${valid.topicId === item.id ? "selected" : ""}`} type="button" key={item.id} aria-pressed={valid.topicId === item.id} onClick={() => { changeSelection((current) => selectTopic(current, item.id)); setStep("ready"); }}>
                <span className="radio-indicator" aria-hidden="true" /><span><strong>{item.name}</strong><small>{item.dba}</small></span>
              </button>
            ))}
          </div>
        )}
      </section>}

      {step === "ready" && <>
      <section className="selection-summary" aria-live="polite">
        <div><p className="eyebrow">Tu selección</p><h2>{topic ? topic.name : "Preparando tu ruta…"}</h2><p>{topic && grade && subject ? `${grade.label} · ${subject.name}` : "Estamos cargando el tema que elegiste."}</p></div>
        <span aria-hidden="true">✦</span>
      </section>
      <DiagnosticDemo key={`${valid.gradeId ?? ""}/${valid.subjectId ?? ""}/${valid.topicId ?? ""}`} selection={valid} />
      </>}
      {step !== "ready" && <p className="catalog-note" role="note">Contenido académico provisional pendiente de revisión docente.</p>}
      </div>
      <div hidden={view === "study"}><AccountPanel section={view === "account" ? "account" : "progress"}
        onOpenAccount={() => navigate("account")}
        onOpenDemoMinor={() => setDemoMinorOpen(true)}
        onProfileSaved={(gradeId, initial) => {
          profileGradeRef.current = gradeId;
          setProfileGradeId(gradeId);
          changeSelection({ gradeId, subjectId: null, topicId: null });
          setStep("subject");
          if (initial) navigate("study");
        }} /></div>
      <footer className="site-footer"><span>Apoyo académico</span><span>Contenido provisional en revisión</span></footer>
    </main>
  );
}
