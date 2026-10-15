"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { grades, subjects, topics } from "@/lib/catalog";
import { comparePracticeSessions, type PracticeHistoryItem } from "@/lib/practice-history";
import { diagnosticSkillInsights } from "@/lib/diagnostic-analysis";
import type { SkillTotal } from "@/lib/progress-insights";
import AccountProgressInsights from "./account-progress-insights";
import StudentRegistrationPreview from "./student-registration-preview";

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

export default function AccountPanel() {
  const [account, setAccount] = useState<Account | null>(null);
  const [diagnosticItems, setDiagnosticItems] = useState<DiagnosticHistoryItem[]>([]);
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState("");
  const [practiceItems, setPracticeItems] = useState<PracticeHistoryItem[]>([]);
  const [skillTotals, setSkillTotals] = useState<SkillTotal[] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const authEpoch = useRef(0);

  const refreshProgress = useCallback(async () => {
    const epoch = authEpoch.current;
    try {
      const [diagnosticResponse, practiceResponse] = await Promise.all([
        fetch("/api/diagnostic/attempts", { cache: "no-store", credentials: "same-origin" }),
        fetch("/api/practice/sessions", { cache: "no-store", credentials: "same-origin" }),
      ]);
      if (epoch !== authEpoch.current) return;
      if (!diagnosticResponse.ok || !practiceResponse.ok) {
        setDiagnosticItems([]);
        setPracticeItems([]);
        setSkillTotals(null);
        setMessage("No se pudo cargar tu progreso. Inténtalo de nuevo.");
        return;
      }
      const [diagnosticBody, practiceBody] = await Promise.all([diagnosticResponse.json(), practiceResponse.json()]);
      if (epoch !== authEpoch.current) return;
      setDiagnosticItems(Array.isArray(diagnosticBody.items) ? diagnosticBody.items : []);
      setPracticeItems(Array.isArray(practiceBody.items) ? practiceBody.items : []);
      setSkillTotals(Array.isArray(practiceBody.skillTotals) ? practiceBody.skillTotals : null);
      setMessage((current) => current === "No se pudo cargar tu progreso. Inténtalo de nuevo." ? "" : current);
    } catch {
      if (epoch === authEpoch.current) {
        setSkillTotals(null);
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
        void refreshProgress();
      })
      .catch(() => { if (mounted) setMessage("No se pudo comprobar la sesión."); });
    const refresh = () => { void refreshProgress(); };
    window.addEventListener("ap-progress-saved", refresh);
    return () => { mounted = false; window.removeEventListener("ap-progress-saved", refresh); };
  }, [refreshProgress]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify(mode === "register" ? { email, password, adultConfirmed } : { email, password }),
      });
      const body = await response.json();
      if (!response.ok || !body.user) throw new Error(typeof body.error === "string" ? body.error : "No se pudo abrir la cuenta.");
      authEpoch.current += 1;
      setAccount(body.user);
      setPassword("");
      setMessage(mode === "register" ? "Cuenta creada. Ya puedes guardar tu avance de prueba." : "Sesión iniciada.");
      window.dispatchEvent(new Event("ap-auth-changed"));
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
      setDiagnosticItems([]);
      setSelectedDiagnosticId("");
      setPracticeItems([]);
      setSkillTotals(null);
      setSelectedTopic("");
      setMessage("Sesión cerrada.");
      window.dispatchEvent(new Event("ap-auth-changed"));
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "No se pudo cerrar la sesión.");
    } finally {
      setBusy(false);
    }
  }

  const completedTopics = [...new Set(practiceItems.filter((item) => item.status === "completed").map((item) => item.topicId))];
  const comparisonTopic = completedTopics.includes(selectedTopic) ? selectedTopic : completedTopics[0] ?? "";
  const comparison = comparisonTopic ? comparePracticeSessions(practiceItems, comparisonTopic) : null;
  const selectedDiagnostic = diagnosticItems.find((item) => item.id === selectedDiagnosticId);
  const diagnosticAnalysis = selectedDiagnostic?.status === "completed" && Array.isArray(selectedDiagnostic.answers)
    ? diagnosticSkillInsights(selectedDiagnostic.answers.map((answer) => ({ id: answer.questionId, skill: answer.skill })), selectedDiagnostic.answers)
    : null;

  return <section className="account-card" aria-labelledby="account-title">
    <div><p className="eyebrow">Cuenta para la demostración</p><h2 id="account-title">Guarda tu recorrido</h2>
      <p>El registro local usa cuentas persistentes de personas adultas o evaluadores. No registres datos de menores reales mientras se define y verifica la autorización de sus representantes.</p></div>
    {account ? <div className="account-panel">
      <p>Sesión iniciada como <strong>{account.email}</strong>.</p>
      <button className="text-button" type="button" onClick={logout} disabled={busy}>Cerrar sesión</button>
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
      <h3>Historial de práctica</h3>
      {practiceItems.length === 0 ? <p>Aún no has iniciado una práctica con seguimiento.</p> : <ul>{practiceItems.map((item) => <li key={item.id}>
        {topicLabel(item)} · {item.status === "completed" ? item.answered === 0 ? "terminada sin respuestas" : `${item.correctCount}/${item.answered} correctas; ${item.answered}/${item.total} respondidas` : `${item.answered}/${item.total} respondidas; pendiente`} · {dateLabel(item.completedAt ?? item.startedAt)}
      </li>)}</ul>}
      <AccountProgressInsights items={practiceItems} totals={skillTotals} />
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
        <p>Comparación orientativa de las preguntas respondidas en dos intentos de demostración. No es una evaluación académica validada.</p>
      </div>}
      {comparison?.status === "insufficient" && comparison.latest && <p>Último intento con respuestas: {comparison.latest.correctCount}/{comparison.latest.answered} correctas · {dateLabel(comparison.latest.completedAt)}.</p>}
      <button className="text-button" type="button" onClick={() => void refreshProgress()}>Actualizar progreso</button>
    </div> : <div className="account-panel">
      <div className="account-tabs"><button type="button" aria-pressed={mode === "login"} onClick={() => { setMode("login"); setMessage(""); }}>Iniciar sesión</button><button type="button" aria-pressed={mode === "register"} onClick={() => { setMode("register"); setMessage(""); }}>Crear cuenta</button></div>
      <form onSubmit={submit}>
        <label>Correo electrónico<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
        <label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 12 : 1} required /></label>
        {mode === "register" && <label className="account-check"><input type="checkbox" checked={adultConfirmed} onChange={(event) => setAdultConfirmed(event.target.checked)} required /> Confirmo que soy mayor de edad y usaré esta cuenta solo para una demostración con datos de prueba.</label>}
        <button className="primary-button" type="submit" disabled={busy}>{busy ? "Procesando…" : mode === "register" ? "Crear cuenta" : "Entrar"}</button>
      </form>
    </div>}
    {message && <p className="account-message" role="status">{message}</p>}
    <StudentRegistrationPreview />
  </section>;
}
