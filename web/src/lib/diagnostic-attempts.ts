import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { AuthError } from "./auth.ts";
import { getAdaptiveDiagnosticBank, selectNextDiagnosticQuestion, type AdaptiveDiagnosticQuestion } from "./diagnostic-adaptive.ts";
import { PRACTICE_BANK_VERSION } from "./practice.ts";

const MAX_QUESTIONS = 4;
const noAnswers = [] as { questionId: string; correct: boolean }[];
type AttemptRow = {
  id: string; user_id: string; grade_id: string; subject_id: string; topic_id: string;
  status: "open" | "completed"; started_at: string; completed_at: string | null; bank_version: string;
};
type AnswerRow = {
  question_id: string; option_id: string; correct: number; skill: string; answered_at: string;
};

function publicQuestion(question: AdaptiveDiagnosticQuestion) {
  return { id: question.id, prompt: question.prompt, options: question.options,
    skill: question.skill, difficulty: question.difficulty };
}

export function openDiagnosticAttemptStore(
  dbPath = process.env.APOYO_DB_PATH || path.join(process.cwd(), "data", "apoyo.sqlite"),
  bankReader: typeof getAdaptiveDiagnosticBank = getAdaptiveDiagnosticBank,
) {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS diagnostic_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      grade_id TEXT NOT NULL, subject_id TEXT NOT NULL, topic_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('open','completed')),
      started_at TEXT NOT NULL, completed_at TEXT,
      bank_version TEXT NOT NULL DEFAULT 'diagnostic-demo-legacy'
    );
    CREATE INDEX IF NOT EXISTS diagnostic_attempts_by_user ON diagnostic_attempts(user_id,topic_id,started_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS diagnostic_one_open_attempt
      ON diagnostic_attempts(user_id,topic_id) WHERE status='open';
    CREATE TABLE IF NOT EXISTS diagnostic_attempt_questions (
      attempt_id TEXT NOT NULL REFERENCES diagnostic_attempts(id) ON DELETE CASCADE,
      position INTEGER NOT NULL, question_id TEXT NOT NULL, snapshot_json TEXT NOT NULL,
      PRIMARY KEY(attempt_id,position), UNIQUE(attempt_id,question_id)
    );
    CREATE TABLE IF NOT EXISTS diagnostic_attempt_answers (
      attempt_id TEXT NOT NULL REFERENCES diagnostic_attempts(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL, option_id TEXT NOT NULL,
      correct INTEGER NOT NULL CHECK(correct IN (0,1)),
      skill TEXT NOT NULL, answered_at TEXT NOT NULL,
      PRIMARY KEY(attempt_id,question_id)
    );`);
  const attemptColumns = db.prepare("PRAGMA table_info(diagnostic_attempts)").all() as { name: string }[];
  if (!attemptColumns.some((column) => column.name === "bank_version")) {
    db.exec("ALTER TABLE diagnostic_attempts ADD COLUMN bank_version TEXT NOT NULL DEFAULT 'diagnostic-demo-legacy'");
  }

  function activeUser(userId: string) {
    if (!db.prepare("SELECT 1 FROM users WHERE id=? AND status='active' AND adult_confirmed=1").get(userId)) {
      throw new AuthError(401, "Sesión requerida.");
    }
  }
  function ownedRow(userId: string, attemptId: unknown): AttemptRow {
    activeUser(userId);
    if (typeof attemptId !== "string" || !/^[0-9a-f]{32}$/.test(attemptId)) {
      throw new AuthError(400, "Intento no válido.");
    }
    const row = db.prepare("SELECT * FROM diagnostic_attempts WHERE id=? AND user_id=?")
      .get(attemptId, userId) as AttemptRow | undefined;
    if (!row) throw new AuthError(404, "Intento no encontrado.");
    return row;
  }
  function questions(attemptId: string): AdaptiveDiagnosticQuestion[] {
    return (db.prepare("SELECT snapshot_json FROM diagnostic_attempt_questions WHERE attempt_id=? ORDER BY position")
      .all(attemptId) as { snapshot_json: string }[])
      .map(({ snapshot_json }) => JSON.parse(snapshot_json) as AdaptiveDiagnosticQuestion);
  }
  function answers(attemptId: string) {
    return (db.prepare("SELECT question_id,option_id,correct,skill,answered_at FROM diagnostic_attempt_answers WHERE attempt_id=? ORDER BY answered_at,rowid")
      .all(attemptId) as AnswerRow[]).map((row) => ({ questionId: row.question_id,
      optionId: row.option_id, correct: row.correct === 1, skill: row.skill, answeredAt: row.answered_at }));
  }
  function view(row: AttemptRow) {
    const bank = questions(row.id);
    const saved = answers(row.id);
    const selection = row.status === "open" && saved.length < MAX_QUESTIONS
      ? selectNextDiagnosticQuestion({ questions: bank, answers: saved, startDifficulty: 1 }) : null;
    const question = selection?.status === "selected" ? publicQuestion(selection.question) : null;
    const attempt = { id: row.id, gradeId: row.grade_id, subjectId: row.subject_id,
      topicId: row.topic_id, status: row.status, answered: saved.length,
      correctCount: saved.filter((answer) => answer.correct).length,
      total: MAX_QUESTIONS, startedAt: row.started_at, completedAt: row.completed_at,
      bankVersion: row.bank_version,
      mode: "demo" as const, validation: "demo-unreviewed" as const };
    return { attempt, question, answers: saved };
  }
  function start(userId: string, body: unknown) {
    activeUser(userId);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError(400, "Selección no válida.");
    const { gradeId, subjectId, topicId, mode } = body as Record<string, unknown>;
    if (mode !== "demo") throw new AuthError(409, "El diagnóstico publicado requiere preguntas aprobadas.");
    if (typeof gradeId !== "string" || typeof subjectId !== "string" || typeof topicId !== "string") {
      throw new AuthError(400, "Selección no válida.");
    }
    const bank = bankReader(gradeId, subjectId, topicId);
    if (!bank) throw new AuthError(400, "Tema inactivo o selección no válida.");
    let usableBank = false;
    if (bank.length >= MAX_QUESTIONS) {
      try {
        usableBank = selectNextDiagnosticQuestion({ questions: bank, answers: noAnswers, startDifficulty: 1 }).status === "selected";
      } catch { /* Un banco incompleto o corrupto no debe abrir un intento. */ }
    }
    if (!usableBank) {
      throw new AuthError(409, "No hay preguntas suficientes para iniciar un diagnóstico.");
    }
    const id = randomBytes(16).toString("hex");
    const now = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      const existing = db.prepare("SELECT id FROM diagnostic_attempts WHERE user_id=? AND topic_id=? AND status='open'")
        .get(userId, topicId);
      if (existing) throw new AuthError(409, "Ya existe un diagnóstico abierto para este tema.");
      db.prepare("INSERT INTO diagnostic_attempts(id,user_id,grade_id,subject_id,topic_id,status,started_at,bank_version) VALUES (?,?,?,?,?,'open',?,?)")
        .run(id, userId, gradeId, subjectId, topicId, now, `diagnostic-demo:${PRACTICE_BANK_VERSION}`);
      const insert = db.prepare("INSERT INTO diagnostic_attempt_questions(attempt_id,position,question_id,snapshot_json) VALUES (?,?,?,?)");
      bank.forEach((question, position) => insert.run(id, position, question.id, JSON.stringify(question)));
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
    return view(ownedRow(userId, id));
  }
  function get(userId: string, attemptId: unknown) { return view(ownedRow(userId, attemptId)); }
  function list(userId: string) {
    activeUser(userId);
    const rows = db.prepare(`SELECT * FROM diagnostic_attempts WHERE user_id=?
      ORDER BY started_at DESC,id DESC LIMIT 100`).all(userId) as AttemptRow[];
    return rows.map((row) => {
      const { attempt, answers: saved } = view(row);
      return { ...attempt, answers: saved };
    });
  }
  function listComparisonSessions(userId: string) {
    activeUser(userId);
    return db.prepare(`WITH scored AS (
      SELECT d.id, d.grade_id AS gradeId, d.subject_id AS subjectId,
        d.topic_id AS topicId, d.completed_at AS completedAt,
        COUNT(a.question_id) AS answered, COALESCE(SUM(a.correct),0) AS correctCount
      FROM diagnostic_attempts d LEFT JOIN diagnostic_attempt_answers a ON a.attempt_id=d.id
      WHERE d.user_id=? AND d.status='completed' AND d.completed_at IS NOT NULL
      GROUP BY d.id HAVING COUNT(a.question_id)>0
    ), ranked AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY topicId ORDER BY completedAt DESC,id DESC) AS position FROM scored
    )
    SELECT id,gradeId,subjectId,topicId,'completed' AS status,completedAt,answered,correctCount
    FROM ranked WHERE position<=2 ORDER BY completedAt DESC,id DESC`).all(userId);
  }
  function latestOpen(userId: string, gradeId: unknown, subjectId: unknown, topicId: unknown) {
    activeUser(userId);
    if (![gradeId, subjectId, topicId].every((value) => typeof value === "string" && value.length > 0)) {
      throw new AuthError(400, "Selección no válida.");
    }
    const row = db.prepare(`SELECT * FROM diagnostic_attempts WHERE user_id=? AND grade_id=?
      AND subject_id=? AND topic_id=? AND status='open' ORDER BY started_at DESC LIMIT 1`)
      .get(userId, gradeId as string, subjectId as string, topicId as string) as AttemptRow | undefined;
    if (!row) throw new AuthError(404, "No hay diagnóstico abierto para este tema.");
    return view(row);
  }
  function answer(userId: string, body: unknown) {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError(400, "Respuesta no válida.");
    const { attemptId, questionId, optionId } = body as Record<string, unknown>;
    if (typeof questionId !== "string" || typeof optionId !== "string") throw new AuthError(400, "Respuesta no válida.");
    let feedback: { questionId: string; correct: boolean; correctOptionId: string; explanation: null; explanationStatus: "pending-review" };
    db.exec("BEGIN IMMEDIATE");
    try {
      const row = ownedRow(userId, attemptId);
      if (row.status !== "open") throw new AuthError(409, "Este diagnóstico ya terminó.");
      const bank = questions(row.id);
      const saved = answers(row.id);
      if (saved.some((item) => item.questionId === questionId)) {
        throw new AuthError(409, "Esta pregunta ya fue respondida.");
      }
      if (saved.length >= MAX_QUESTIONS) throw new AuthError(409, "Este diagnóstico ya alcanzó el límite de preguntas.");
      const selected = selectNextDiagnosticQuestion({ questions: bank, answers: saved, startDifficulty: 1 });
      if (selected.status !== "selected") throw new AuthError(409, "No quedan preguntas en este diagnóstico.");
      if (selected.question.id !== questionId) throw new AuthError(400, "La pregunta no es la siguiente de este diagnóstico.");
      if (!selected.question.options.some((option) => option.id === optionId)) throw new AuthError(400, "Selecciona una opción válida.");
      const correct = selected.question.correctOptionId === optionId;
      const now = new Date().toISOString();
      db.prepare("INSERT INTO diagnostic_attempt_answers(attempt_id,question_id,option_id,correct,skill,answered_at) VALUES (?,?,?,?,?,?)")
        .run(row.id, questionId, optionId, correct ? 1 : 0, selected.question.skill, now);
      const updated = [...saved, { questionId, optionId, correct, skill: selected.question.skill, answeredAt: now }];
      const next = selectNextDiagnosticQuestion({ questions: bank, answers: updated, startDifficulty: 1 });
      if (next.status === "exhausted" && updated.length < MAX_QUESTIONS) {
        throw new AuthError(409, "Banco agotado antes de completar el diagnóstico; no se guardó resultado.");
      }
      if (updated.length >= MAX_QUESTIONS) {
        db.prepare("UPDATE diagnostic_attempts SET status='completed',completed_at=? WHERE id=? AND user_id=?")
          .run(now, row.id, userId);
        db.prepare(`INSERT INTO progress(user_id,grade_id,subject_id,topic_id,kind,completed,updated_at)
          VALUES (?,?,?,?, 'diagnostic',1,?)
          ON CONFLICT(user_id,topic_id,kind) DO UPDATE SET completed=1,updated_at=excluded.updated_at`)
          .run(userId, row.grade_id, row.subject_id, row.topic_id, now);
      }
      feedback = { questionId, correct, correctOptionId: selected.question.correctOptionId,
        explanation: null, explanationStatus: "pending-review" };
      db.exec("COMMIT");
      return { ...view(ownedRow(userId, row.id)), feedback };
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  }
  return { start, get, list, listComparisonSessions, latestOpen, answer, close: () => db.close() };
}

let singleton: ReturnType<typeof openDiagnosticAttemptStore> | undefined;
export function diagnosticAttemptStore() { return singleton ??= openDiagnosticAttemptStore(); }
