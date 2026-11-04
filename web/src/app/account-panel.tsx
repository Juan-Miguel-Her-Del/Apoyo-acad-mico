"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { grades, subjects, topics } from "@/lib/catalog";
import type { AccountProfile } from "@/lib/profile";
import { comparePracticeSessions, type PracticeHistoryItem } from "@/lib/practice-history";
import { diagnosticSkillInsights } from "@/lib/diagnostic-analysis";
import type { SkillTotal } from "@/lib/progress-insights";
import type { Recommendation, StudyStreak } from "@/lib/study-planning";
import AccountProgressInsights from "./account-progress-insights";

type Account = { id: string; email: string };
type DiagnosticHistoryItem = {
  id: string; gradeId: string; subjectId: string; topicId: string;
  status: "open" | "completed"; answered: number; correctCount: number; total: number;
  startedAt: string; completedAt: string | null; validation: "demo-unreviewed";
  answers: { questionId: string; optionId: string; correct: boolean; skill: string; answeredAt: string }[];
};
function topicLabel(item: Pick<PracticeHistoryItem, "gradeId" | "subjectId" | "topicId">) {
  const grade = grades.find((value) => value.id === item.gradeId)?.label ?? item.gradeId;
  const subject = subjects.find((value) => value.id === item.subjectId)?.name ?? item.subjectId;
  const topic = topics.find((value) => value.id === item.topicId)?.name ?? item.topicId;
  return `${grade} · ${subject} · ${topic}`;
}
function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "sin fecha";
}

export default function AccountPanel({ section, onOpenAccount, onProfileSaved, onOpenDemoMinor, compact = false }: {
  section: "account" | "progress";
  onOpenAccount: () => void;
  onProfileSaved: (gradeId: string, initial: boolean) => void;
  onOpenDemoMinor?: () => void;
  compact?: boolean;
}) {
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [profileStatus, setProfileStatus] = useState<"loading" | "ready" | "error">("loading");
  const [displayName, setDisplayName] = useState("");
  const [profileGradeId, setProfileGradeId] = useState("");
  const [diagnosticItems, setDiagnosticItems] = useState<DiagnosticHistoryItem[]>([]);
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState("");
  const [practiceItems, setPracticeItems] = useState<PracticeHistoryItem[]>([]);
  const [skillTotals, setSkillTotals] = useState<SkillTotal[] | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [streak, setStreak] = useState<StudyStreak | null>(null);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [progressScreen, setProgressScreen] = useState<"overview" | "diagnostics" | "practice" | "insights">("overview");
  const [accountScreen, setAccountScreen] = useState<"profile" | "security">("profile");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registerStep, setRegisterStep] = useState<"access" | "profile">("access");
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);
  const [accountType, setAccountType] = useState<"adult" | "minor">("adult");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const authEpoch = useRef(0);

  const loadProfile = useCallback(async (epoch: number) => {
    setProfileStatus("loading");
    try {
      const response = await fetch("/api/profile", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error("No se pudo cargar el perfil.");
      const body = await response.json();
      if (epoch !== authEpoch.current) return;
      const next = body.profile as AccountProfile | null;
      setProfile(next);
      setDisplayName(next?.displayName ?? "");
      setProfileGradeId(next?.gradeId ?? "");
      setProfileStatus("ready");
    } catch {
      if (epoch === authEpoch.current) setProfileStatus("error");
    }
  }, []);

  const refreshProgress = useCallback(async () => {
    const epoch = authEpoch.current;
    try {
      const [diagnosticResponse, practiceResponse, summaryResponse] = await Promise.all([
        fetch("/api/diagnostic/attempts", { cache: "no-store", credentials: "same-origin" }),
        fetch("/api/practice/sessions", { cache: "no-store", credentials: "same-origin" }),
        fetch("/api/study/summary", { cache: "no-store", credentials: "same-origin" }),
      ]);
      if (epoch !== authEpoch.current) return;
      if (!diagnosticResponse.ok || !practiceResponse.ok) {
        setDiagnosticItems([]);
        setPracticeItems([]);
        setSkillTotals(null);
        setRecommendation(null);
        setStreak(null);
        setMessage("No se pudo cargar tu progreso. Inténtalo de nuevo.");
        return;
      }
      const [diagnosticBody, practiceBody, summaryBody] = await Promise.all([
        diagnosticResponse.json(), practiceResponse.json(), summaryResponse.ok ? summaryResponse.json() : null,
      ]);
      if (epoch !== authEpoch.current) return;
      setDiagnosticItems(Array.isArray(diagnosticBody.items) ? diagnosticBody.items : []);
      setPracticeItems(Array.isArray(practiceBody.items) ? practiceBody.items : []);
      setSkillTotals(Array.isArray(practiceBody.skillTotals) ? practiceBody.skillTotals : null);
      setRecommendation(summaryBody?.recommendation ?? null);
      setStreak(summaryBody?.streak ?? null);
      setMessage((current) => current === "No se pudo cargar tu progreso. Inténtalo de nuevo." ? "" : current);
    } catch {
      if (epoch === authEpoch.current) {
        setSkillTotals(null);
        setRecommendation(null);
        setStreak(null);
        setMessage("No se pudo cargar tu progreso. Inténtalo de nuevo.");
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const epoch = authEpoch.current;
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((body) => {
        if (!mounted || epoch !== authEpoch.current || !body?.user) return;
        setAccount(body.user);
        void loadProfile(epoch);
        void refreshProgress();
      })
      .catch(() => { if (mounted) setMessage("No se pudo comprobar la sesión."); });
    const refresh = () => { void refreshProgress(); };
    window.addEventListener("ap-progress-saved", refresh);
    return () => { mounted = false; window.removeEventListener("ap-progress-saved", refresh); };
  }, [loadProfile, refreshProgress]);

  useEffect(() => {
    fetch("/api/auth/email-status", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : { configured: false })
      .then((body) => setEmailConfigured(body.configured === true))
      .catch(() => setEmailConfigured(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (mode === "register" && registerStep === "access") {
      setRegisterStep("profile");
      setMessage("");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify(mode === "register"
          ? { email, password, displayName, gradeId: profileGradeId, adultConfirmed }
          : { email, password }),
      });
      const body = await response.json();
      if (mode === "register") {
        if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "No se pudo enviar la confirmación.");
        setPassword("");
        setVerificationSent(true);
        setMessage("Revisa tu correo y abre el enlace de confirmación para activar la cuenta. Puede tardar unos minutos.");
        return;
      }
      if (!response.ok || !body.user) throw new Error(typeof body.error === "string" ? body.error : "No se pudo abrir la cuenta.");
      authEpoch.current += 1;
      setAccount(body.user);
      setAccountScreen("profile"); setProgressScreen("overview");
      setProfile(null);
      setProfileStatus("loading");
      setPassword("");
      setMessage("Sesión iniciada.");
      window.dispatchEvent(new Event("ap-auth-changed"));
      await loadProfile(authEpoch.current);
      await refreshProgress();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "No se pudo abrir la cuenta.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      if (!response.ok) throw new Error("No se pudo cerrar la sesión.");
      authEpoch.current += 1;
      setAccount(null);
      setAccountScreen("profile"); setProgressScreen("overview");
      setProfile(null);
      setProfileStatus("loading");
      setDiagnosticItems([]);
      setSelectedDiagnosticId("");
      setPracticeItems([]);
      setSkillTotals(null);
      setRecommendation(null);
      setStreak(null);
      setSelectedTopic("");
      setMessage("Sesión cerrada.");
      window.dispatchEvent(new Event("ap-auth-changed"));
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "No se pudo cerrar la sesión.");
    } finally {
      setBusy(false);
    }
  }

  async function requestRecovery() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/auth/password-reset/request", { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const body = await response.json();
      setMessage(response.ok ? body.message : body.error ?? "No se pudo solicitar la recuperación.");
      if (response.ok) setRecoveryOpen(false);
    } catch { setMessage("No se pudo solicitar la recuperación."); }
    finally { setBusy(false); }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/auth/delete", { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation, password: deletePassword }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "No se pudo eliminar la cuenta.");
      authEpoch.current += 1;
      setAccount(null); setDiagnosticItems([]); setPracticeItems([]); setSkillTotals(null);
      setAccountScreen("profile"); setProgressScreen("overview");
      setProfile(null); setProfileStatus("loading");
      setRecommendation(null); setStreak(null); setDeleteOpen(false);
      setDeleteConfirmation(""); setDeletePassword("");
      setMessage("Tu cuenta y sus datos guardados fueron eliminados.");
      window.sessionStorage.setItem("ap-account-deleted", "1");
      window.dispatchEvent(new Event("ap-auth-changed"));
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "No se pudo eliminar la cuenta."); }
    finally { setBusy(false); }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile", { method: "PUT", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, gradeId: profileGradeId }) });
      const body = await response.json();
      if (!response.ok || !body.profile) throw new Error(body.error ?? "No se pudo guardar el perfil.");
      const next = body.profile as AccountProfile;
      const initial = profile === null;
      const gradeChanged = profile?.gradeId !== next.gradeId;
      setProfile(next);
      setDisplayName(next.displayName);
      setProfileGradeId(next.gradeId);
      setMessage(gradeChanged && !initial
        ? "Grado actualizado. Tu historial anterior se conserva."
        : "Perfil guardado.");
      if (gradeChanged) {
        onProfileSaved(next.gradeId, initial);
        void refreshProgress();
      }
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "No se pudo guardar el perfil."); }
    finally { setBusy(false); }
  }

  const completedTopics = [...new Set(practiceItems.filter((item) => item.status === "completed").map((item) => item.topicId))];
  const comparisonTopic = completedTopics.includes(selectedTopic) ? selectedTopic : completedTopics[0] ?? "";
  const comparison = comparisonTopic ? comparePracticeSessions(practiceItems, comparisonTopic) : null;
  const selectedDiagnostic = diagnosticItems.find((item) => item.id === selectedDiagnosticId);
  const diagnosticAnalysis = selectedDiagnostic?.status === "completed" && Array.isArray(selectedDiagnostic.answers)
    ? diagnosticSkillInsights(selectedDiagnostic.answers.map((answer) => ({ id: answer.questionId, skill: answer.skill })), selectedDiagnostic.answers)
    : null;

  return <section className={`account-card${compact ? " account-card-compact" : ""}`} aria-labelledby="account-title">
    <div><p className="eyebrow">{section === "progress" ? "Tus avances" : "Tu cuenta"}</p><h2 id="account-title">{section === "progress" ? "Tu recorrido" : account ? "Tu perfil" : "Comienza a estudiar"}</h2>
      <p>{section === "progress" ? "Consulta cada parte de tu progreso por separado." : account ? "Gestiona tu grado y los datos de tu cuenta." : "Entra o crea tu perfil para conservar tus avances."}</p></div>
    {account ? <div className="account-panel">
      <p>Sesión iniciada como <strong>{profile?.displayName ?? account.email}</strong>{profile && <> · {account.email}</>}.</p>
      {section === "account" && <button className="text-button" type="button" onClick={logout} disabled={busy}>Cerrar sesión</button>}
      {section === "progress" && <>
      {!profile && <div className="profile-reminder"><strong>Completa tu perfil</strong><p>Elige un nombre para mostrar y el grado que cursas o estás preparando.</p><button className="text-button" type="button" onClick={onOpenAccount}>Preparar mi perfil</button></div>}
      {progressScreen !== "overview" && <button className="text-button screen-back" type="button" onClick={() => setProgressScreen("overview")}>← Volver a mi progreso</button>}
      {progressScreen === "overview" && <>
      <div className="study-summary" role="status">
        <h3>Tu siguiente paso</h3>
        {recommendation ? <><p>{recommendation.reason}</p><button className="text-button" type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("ap-select-topic", { detail: { topicId: recommendation.topicId } }))}>Ir al tema recomendado</button></>
          : <p>Elige un tema para recibir una sugerencia de estudio.</p>}
        <p>Racha de práctica: <strong>{streak?.days ?? 0} {streak?.days === 1 ? "día" : "días"}</strong>.</p>
      </div>
      <div className="screen-card-grid" aria-label="Secciones de progreso">
        <button type="button" onClick={() => setProgressScreen("diagnostics")}><strong>Diagnósticos</strong><span>{diagnosticItems.length} intentos guardados</span><span>Ver resultados →</span></button>
        <button type="button" onClick={() => setProgressScreen("practice")}><strong>Prácticas</strong><span>{practiceItems.length} sesiones guardadas</span><span>Ver historial y comparar →</span></button>
        <button type="button" onClick={() => setProgressScreen("insights")}><strong>Evolución</strong><span>Consulta subtemas y gráficas</span><span>Explorar progreso →</span></button>
      </div>
      <button className="text-button" type="button" onClick={() => void refreshProgress()}>Actualizar progreso</button>
      <p className="content-status">Resultados orientativos con contenido pendiente de revisión docente.</p>
      </>}
      {progressScreen === "diagnostics" && <div className="progress-detail-screen">
      <h3>Intentos diagnósticos guardados</h3>
      {diagnosticItems.length === 0 ? <p>Aún no has guardado un intento diagnóstico en esta cuenta.</p> : <ul>{diagnosticItems.map((item) => <li key={item.id}>
        {topicLabel(item)} · {item.status === "completed" ? `${item.correctCount}/${item.answered} correctas` : `${item.answered}/${item.total} respondidas; pendiente`} · {dateLabel(item.completedAt ?? item.startedAt)}. {item.status === "completed" && <button className="text-button" type="button" aria-expanded={selectedDiagnosticId === item.id} onClick={() => setSelectedDiagnosticId((current) => current === item.id ? "" : item.id)}>Ver resumen</button>}
      </li>)}</ul>}
      {selectedDiagnostic?.status === "completed" && <div className="comparison-result" role="status">
        <h4>Resumen de {topicLabel(selectedDiagnostic)}</h4>
        <p>{selectedDiagnostic.correctCount} de {selectedDiagnostic.answered} respuestas correctas · {dateLabel(selectedDiagnostic.completedAt)}.</p>
        {diagnosticAnalysis?.skills.length ? <ul>{diagnosticAnalysis.skills.map((skill) => <li key={skill.skill}>{skill.skill}: {skill.correct}/{skill.answered} correctas · {skill.strength ? "fortaleza observada" : skill.status === "dificultad-demo" ? "señal de dificultad" : "evidencia indeterminada"} · confianza {skill.confidence === null ? "insuficiente" : `${skill.confidence} %`}.</li>)}</ul> : <p>No hay suficientes respuestas por subtema para analizar.</p>}
        <p>Resumen provisional basado en las respuestas guardadas de esta cuenta; no es una evaluación académica validada.</p>
      </div>}
      </div>}
      {progressScreen === "practice" && <div className="progress-detail-screen">
      <h3>Historial de práctica</h3>
      {practiceItems.length === 0 ? <p>Aún no has iniciado una práctica con seguimiento.</p> : <ul>{practiceItems.map((item) => <li key={item.id}>
        {topicLabel(item)} · {item.status === "completed" ? item.answered === 0 ? "terminada sin respuestas" : `${item.correctCount}/${item.answered} correctas; ${item.answered}/${item.total} respondidas` : `${item.answered}/${item.total} respondidas; pendiente`} · {dateLabel(item.completedAt ?? item.startedAt)}
      </li>)}</ul>}
      <h3>Comparar intentos de un tema</h3>
      {completedTopics.length > 0 && <label className="comparison-label">Tema
        <select value={comparisonTopic} onChange={(event) => setSelectedTopic(event.target.value)}>
          {completedTopics.map((topicId) => {
            const item = practiceItems.find((value) => value.topicId === topicId)!;
            return <option key={topicId} value={topicId}>{topicLabel(item)}</option>;
          })}
        </select>
      </label>}
      {!comparison || comparison.status === "insufficient" ? <p>Aún no hay sesiones suficientes para comparar tu progreso.</p> : <div className="comparison-result" role="status">
        <p>Anterior: {comparison.previous.correctCount}/{comparison.previous.answered} correctas · {dateLabel(comparison.previous.completedAt)}.</p>
        <p>Reciente: {comparison.latest.correctCount}/{comparison.latest.answered} correctas · {dateLabel(comparison.latest.completedAt)}.</p>
        <strong>{comparison.deltaPoints > 0 ? `Subiste ${comparison.deltaPoints} puntos porcentuales` : comparison.deltaPoints < 0 ? `Bajaste ${Math.abs(comparison.deltaPoints)} puntos porcentuales` : "Mismo porcentaje de aciertos"}.</strong>
        <p>Comparación orientativa de dos intentos con preguntas provisionales. No es una evaluación académica validada.</p>
      </div>}
      {comparison?.status === "insufficient" && comparison.latest && <p>Último intento con respuestas: {comparison.latest.correctCount}/{comparison.latest.answered} correctas · {dateLabel(comparison.latest.completedAt)}.</p>}
      </div>}
      {progressScreen === "insights" && <div className="progress-detail-screen"><AccountProgressInsights items={practiceItems} totals={skillTotals} /></div>}
      </>}
      {section === "account" && accountScreen === "profile" && <>
      <div className="profile-setup">
        <span className="profile-role">Estudiante mayor de edad</span>
        <h3>{profile ? "Datos de estudio" : "Prepara tu perfil"}</h3>
        <p>Usa un nombre o apodo para mostrar y elige el grado que cursas o estás preparando, incluido si estudias por ciclos. Puedes cambiarlo después; tus avances anteriores se conservan.</p>
        {profileStatus === "loading" ? <p role="status">Cargando perfil…</p> : profileStatus === "error" ? <div role="alert"><p>No se pudo cargar tu perfil.</p><button className="text-button" type="button" onClick={() => void loadProfile(authEpoch.current)}>Reintentar</button></div> :
          <form onSubmit={saveProfile}>
            <label>Nombre para mostrar<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={40} autoComplete="nickname" required placeholder="Tu nombre o apodo" /></label>
            <label>Grado que cursas o preparas<select value={profileGradeId} onChange={(event) => setProfileGradeId(event.target.value)} required>
              <option value="">Selecciona un grado</option>
              {grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.label} · {grade.group}</option>)}
            </select></label>
            <button className="primary-button" type="submit" disabled={busy}>{busy ? "Guardando…" : profile ? "Guardar cambios" : "Guardar y elegir materia"}</button>
          </form>}
      </div>
      <button className="text-button" type="button" onClick={() => setAccountScreen("security")}>Datos y seguridad →</button>
      </>}
      {section === "account" && accountScreen === "security" && <div className="security-screen">
      <button className="text-button screen-back" type="button" onClick={() => { setAccountScreen("profile"); setDeleteOpen(false); }}>← Volver a mi perfil</button>
      <h3>Datos y seguridad</h3>
      <p>Consulta el <Link href="/privacidad">estado de privacidad</Link> y los <Link href="/terminos">términos de uso</Link>.</p>
      <div className="account-deletion">
        <h3>Eliminar mi cuenta</h3>
        <p>Se borrarán esta cuenta, sus sesiones, diagnósticos, prácticas y progreso guardado. Esta acción no se puede deshacer.</p>
        {!deleteOpen ? <button className="text-button" type="button" onClick={() => setDeleteOpen(true)}>Solicitar eliminación</button>
          : <form onSubmit={deleteAccount}>
            <label>Escribe ELIMINAR<input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} required /></label>
            <label>Contraseña actual<input type="password" autoComplete="current-password" value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)} required /></label>
            <button className="primary-button" type="submit" disabled={busy || deleteConfirmation !== "ELIMINAR"}>Eliminar cuenta y datos</button>
            <button className="text-button" type="button" onClick={() => { setDeleteOpen(false); setDeletePassword(""); setDeleteConfirmation(""); }}>Cancelar</button>
          </form>}
      </div>
      </div>}
    </div> : section === "account" ? <div className="account-panel">
      <div className="account-tabs"><button type="button" aria-pressed={mode === "login"} onClick={() => { setMode("login"); setRegisterStep("access"); setVerificationSent(false); setMessage(""); }}>Iniciar sesión</button><button type="button" aria-pressed={mode === "register"} onClick={() => { setMode("register"); setRegisterStep("access"); setVerificationSent(false); setMessage(""); }}>Crear cuenta</button></div>
      {mode === "register" && <><div className="account-type-choice" aria-label="Tipo de cuenta">
        <button type="button" aria-pressed={accountType === "adult"} onClick={() => setAccountType("adult")}>Estudiante de 18 años o más</button>
        <button type="button" aria-pressed={accountType === "minor"} onClick={() => setAccountType("minor")}>Estudiante menor de 18</button>
      </div>
      <div className="policy-preview"><strong>Antes de crear tu perfil</strong><p>La política de datos y los términos están en revisión. Consulta el <Link href="/privacidad">estado de privacidad</Link> y el <Link href="/terminos">estado de los términos</Link>. Estos textos aún no son documentos definitivos.</p></div>
      {accountType === "adult" && emailConfigured === false && <p role="status">El envío de correos de confirmación aún no está configurado. El registro estará disponible cuando se conecte.</p>}
      </>}
      {mode === "register" && accountType === "minor" ? <div className="student-account-gate" role="status"><h3>Registro para menores</h3><p>El registro real de menores sigue cerrado. Puedes crear un perfil ficticio para probar el recorrido sin datos personales; se guarda solo en este navegador.</p>{onOpenDemoMinor && <button className="primary-button" type="button" onClick={onOpenDemoMinor}>Crear perfil ficticio de prueba</button>}<p><Link href="/privacidad">Ver estado de privacidad</Link></p></div> : verificationSent && mode === "register" ? <div className="verification-sent" role="status"><h3>Revisa tu correo</h3><p>Enviamos un enlace para confirmar la dirección y activar tu perfil. Revisa también la carpeta de correo no deseado.</p><button className="text-button" type="button" onClick={() => { setVerificationSent(false); setRegisterStep("access"); setMessage(""); }}>Volver al registro o solicitar otro enlace</button></div> : <>
      <form onSubmit={submit}>
        {mode === "login" || registerStep === "access" ? <>
          <label>Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
          <label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 12 : 1} required /></label>
        </> : <>
          <p><strong>Paso 2 de 2:</strong> prepara tu perfil antes de entrar.</p>
          <label>Nombre para mostrar<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={2} maxLength={40} autoComplete="nickname" required placeholder="Tu nombre o apodo" /></label>
          <label>Grado que cursas o preparas<select value={profileGradeId} onChange={(event) => setProfileGradeId(event.target.value)} required>
            <option value="">Selecciona un grado</option>
            {grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.label} · {grade.group}</option>)}
          </select></label>
          <label className="account-check"><input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} required /> Confirmo que tengo 18 años o más y que esta cuenta será para mi propio estudio.</label>
          <button className="text-button" type="button" onClick={() => setRegisterStep("access")}>Volver a correo y contraseña</button>
        </>}
        <button className="primary-button" type="submit" disabled={busy || (mode === "register" && registerStep === "profile" && emailConfigured !== true)}>{busy ? "Procesando…" : mode === "login" ? "Entrar" : registerStep === "access" ? "Continuar al perfil" : "Crear cuenta y enviar confirmación"}</button>
      </form>
      {mode === "login" && <div><button className="text-button" type="button" onClick={() => setRecoveryOpen((current) => !current)}>¿Olvidaste tu contraseña?</button>
        {recoveryOpen && <div><p>Escribe el correo de tu cuenta. Te enviaremos un enlace de 30 minutos si la recuperación está configurada.</p>
          <button className="text-button" type="button" disabled={busy || !email} onClick={() => void requestRecovery()}>Enviar enlace</button></div>}</div>}
      </>}
    </div> : <div className="account-panel progress-gate"><h3>Entra para ver tu progreso</h3><p>El progreso se guarda en tu cuenta. Actualmente puedes registrarte si tienes 18 años o más.</p><button className="primary-button" type="button" onClick={onOpenAccount}>Ir a mi cuenta</button></div>}
    {message && <p className="account-message" role="status">{message}</p>}
  </section>;
}
