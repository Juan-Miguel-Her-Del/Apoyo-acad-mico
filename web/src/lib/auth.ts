import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";
import { topics } from "./catalog.ts";
import { getPracticeBank, publicPracticeQuestions, PRACTICE_BANK_VERSION, type PracticeQuestion } from "./practice.ts";
import { correctionExplanation } from "./practice-feedback.ts";

const scrypt = promisify(scryptCallback);
const SESSION_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_COOKIE = "apoyo_session";
export type PublicUser = { id: string; email: string };
export type ProgressKind = "study" | "diagnostic";
export type ProgressItem = {
  gradeId: string;
  subjectId: string;
  topicId: string;
  kind: ProgressKind;
  completed: true;
  updatedAt: string;
};
export type PracticeSession = {
  id: string; gradeId: string; subjectId: string; topicId: string;
  status: "open" | "completed"; total: number; answered: number;
  correctCount: number; startedAt: string; completedAt: string | null;
  targetDifficulty: 1 | 2; difficultyFallback: boolean;
  bankVersion: string;
  skills: { skillId: string; answered: number; correctCount: number }[];
};
export type PracticeAnswer = {
  questionId: string; optionId: string; correct: boolean;
  correctOptionId: string; explanation: string | null; explanationStatus: "pending-review" | "approved";
  skillId: string; answeredAt: string;
};
type PracticeSessionRow = {
  id: string; grade_id: string; subject_id: string; topic_id: string;
  status: "open" | "completed"; total: number; started_at: string; completed_at: string | null;
  answered: number; correct_count: number;
  target_difficulty: number; difficulty_fallback: number; bank_version: string;
};

type UserRow = { id: string; email: string; salt: string; password_hash: string; status: string };

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function sha256(value: string) { return createHash("sha256").update(value).digest("hex"); }
function normalizedEmail(value: unknown) {
  if (typeof value !== "string") throw new AuthError(400, "Correo no válido.");
  const email = value.trim().toLowerCase();
  if (email.length < 5 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AuthError(400, "Correo no válido.");
  }
  return email;
}
function validPassword(value: unknown) {
  if (typeof value !== "string" || value.length < 12 || value.length > 128) {
    throw new AuthError(400, "La contraseña debe tener entre 12 y 128 caracteres.");
  }
  return value;
}
async function passwordHash(password: string, salt: string) {
  return (await scrypt(password, salt, 64)) as Buffer;
}

export function openAuthStore(dbPath = process.env.APOYO_DB_PATH || path.join(process.cwd(), "data", "apoyo.sqlite")) {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, salt TEXT NOT NULL,
      password_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
      adult_confirmed INTEGER NOT NULL CHECK(adult_confirmed = 1), created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_by_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      grade_id TEXT NOT NULL, subject_id TEXT NOT NULL, topic_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('study','diagnostic')),
      completed INTEGER NOT NULL CHECK(completed = 1), updated_at TEXT NOT NULL,
      PRIMARY KEY(user_id, topic_id, kind)
    );
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      grade_id TEXT NOT NULL, subject_id TEXT NOT NULL, topic_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('open','completed')),
      total INTEGER NOT NULL CHECK(total > 0), started_at TEXT NOT NULL, completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS practice_sessions_by_user ON practice_sessions(user_id, started_at DESC);
    CREATE TABLE IF NOT EXISTS practice_answers (
      session_id TEXT NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL, option_id TEXT NOT NULL,
      correct INTEGER NOT NULL CHECK(correct IN (0,1)),
      correct_option_id TEXT NOT NULL, explanation TEXT NOT NULL, answered_at TEXT NOT NULL,
      PRIMARY KEY(session_id,question_id)
    );
    CREATE TABLE IF NOT EXISTS practice_session_questions (
      session_id TEXT NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
      position INTEGER NOT NULL, question_id TEXT NOT NULL, snapshot_json TEXT NOT NULL,
      PRIMARY KEY(session_id,position), UNIQUE(session_id,question_id)
    );`);

  const sessionColumns = db.prepare("PRAGMA table_info(practice_sessions)").all() as { name: string }[];
  if (!sessionColumns.some((column) => column.name === "target_difficulty")) {
    db.exec("ALTER TABLE practice_sessions ADD COLUMN target_difficulty INTEGER NOT NULL DEFAULT 1");
  }
  if (!sessionColumns.some((column) => column.name === "difficulty_fallback")) {
    db.exec("ALTER TABLE practice_sessions ADD COLUMN difficulty_fallback INTEGER NOT NULL DEFAULT 0");
  }
  if (!sessionColumns.some((column) => column.name === "bank_version")) {
    db.exec("ALTER TABLE practice_sessions ADD COLUMN bank_version TEXT NOT NULL DEFAULT 'legacy-demo-v1'");
  }
  const answerColumns = db.prepare("PRAGMA table_info(practice_answers)").all() as { name: string }[];
  if (!answerColumns.some((column) => column.name === "skill_id")) {
    db.exec("ALTER TABLE practice_answers ADD COLUMN skill_id TEXT NOT NULL DEFAULT ''");
  }

  function publicUser(row: UserRow): PublicUser { return { id: row.id, email: row.email }; }
  function createSession(userId: string) {
    const token = randomBytes(32).toString("hex");
    const now = Date.now();
    db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)")
      .run(sha256(token), userId, now + SESSION_SECONDS * 1000, new Date(now).toISOString());
    return token;
  }
  async function register(body: unknown) {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError(400, "Solicitud no válida.");
    const data = body as Record<string, unknown>;
    // The adult-only path deliberately ignores and never persists rejected minor data.
    if (data.adultConfirmed !== true) throw new AuthError(403, "Las cuentas de menores requieren autorización verificada del representante y aún no están disponibles.");
    if (Object.keys(data).some((key) => !["email", "password", "adultConfirmed"].includes(key))) {
      throw new AuthError(400, "Datos adicionales no permitidos.");
    }
    const email = normalizedEmail(data.email);
    const password = validPassword(data.password);
    const salt = randomBytes(16).toString("hex");
    const hash = (await passwordHash(password, salt)).toString("hex");
    const id = randomBytes(16).toString("hex");
    try {
      db.prepare("INSERT INTO users(id,email,salt,password_hash,adult_confirmed,created_at) VALUES (?,?,?,?,1,?)")
        .run(id, email, salt, hash, new Date().toISOString());
    } catch (error) {
      if (String(error).includes("UNIQUE constraint failed")) throw new AuthError(409, "No se pudo crear la cuenta.");
      throw error;
    }
    return { user: { id, email }, token: createSession(id) };
  }
  async function login(body: unknown) {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError(400, "Solicitud no válida.");
    const data = body as Record<string, unknown>;
    const email = normalizedEmail(data.email);
    if (typeof data.password !== "string" || data.password.length > 128) throw new AuthError(401, "Credenciales no válidas.");
    const row = db.prepare("SELECT id,email,salt,password_hash,status FROM users WHERE email=?").get(email) as UserRow | undefined;
    // Perform scrypt even for unknown accounts to reduce account enumeration by timing.
    const candidate = await passwordHash(data.password, row?.salt ?? "00000000000000000000000000000000");
    const expected = Buffer.from(row?.password_hash ?? "00".repeat(64), "hex");
    if (!row || row.status !== "active" || !timingSafeEqual(candidate, expected)) {
      throw new AuthError(401, "Credenciales no válidas.");
    }
    return { user: publicUser(row), token: createSession(row.id) };
  }
  function sessionUser(token: string | null | undefined): PublicUser | null {
    if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
    const row = db.prepare(`SELECT users.id,users.email,users.salt,users.password_hash,users.status
      FROM sessions JOIN users ON users.id=sessions.user_id
      WHERE sessions.token_hash=? AND sessions.expires_at>? AND users.status='active'`)
      .get(sha256(token), Date.now()) as UserRow | undefined;
    return row ? publicUser(row) : null;
  }
  function logout(token: string | null | undefined) {
    if (token && /^[0-9a-f]{64}$/.test(token)) db.prepare("DELETE FROM sessions WHERE token_hash=?").run(sha256(token));
  }
  function disableUser(userId: string) {
    db.prepare("UPDATE users SET status='disabled' WHERE id=?").run(userId);
    db.prepare("DELETE FROM sessions WHERE user_id=?").run(userId);
  }
  function saveProgress(userId: string, body: unknown): ProgressItem {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError(400, "Progreso no válido.");
    const item = body as Record<string, unknown>;
    const { gradeId, subjectId, topicId, kind, completed } = item;
    if (typeof gradeId !== "string" || typeof subjectId !== "string" || typeof topicId !== "string" ||
        kind !== "diagnostic" || completed !== true ||
        !topics.some((topic) => topic.id === topicId && topic.gradeId === gradeId && topic.subjectId === subjectId && topic.active && topic.pilotCandidate)) {
      throw new AuthError(400, "Progreso no válido para ese tema.");
    }
    const active = db.prepare("SELECT id FROM users WHERE id=? AND status='active'").get(userId);
    if (!active) throw new AuthError(401, "Sesión no válida.");
    const updatedAt = new Date().toISOString();
    db.prepare(`INSERT INTO progress(user_id,grade_id,subject_id,topic_id,kind,completed,updated_at)
      VALUES (?,?,?,?,?,1,?) ON CONFLICT(user_id,topic_id,kind) DO UPDATE SET completed=1,updated_at=excluded.updated_at`)
      .run(userId, gradeId, subjectId, topicId, kind, updatedAt);
    return { gradeId, subjectId, topicId, kind, completed: true, updatedAt };
  }
  function listProgress(userId: string): ProgressItem[] {
    const active = db.prepare("SELECT id FROM users WHERE id=? AND status='active'").get(userId);
    if (!active) throw new AuthError(401, "Sesión no válida.");
    const rows = db.prepare(`SELECT grade_id,subject_id,topic_id,kind,updated_at FROM progress
      WHERE user_id=? ORDER BY updated_at DESC LIMIT 100`).all(userId) as {
        grade_id: string; subject_id: string; topic_id: string; kind: ProgressKind; updated_at: string
      }[];
    return rows.map((row) => ({ gradeId: row.grade_id, subjectId: row.subject_id, topicId: row.topic_id,
      kind: row.kind, completed: true, updatedAt: row.updated_at }));
  }
  function activeUser(userId: string) {
    if (!db.prepare("SELECT id FROM users WHERE id=? AND status='active' AND adult_confirmed=1").get(userId)) {
      throw new AuthError(401, "Sesión no válida.");
    }
  }
  function sessionFromRow(row: PracticeSessionRow): PracticeSession {
    const skills = db.prepare(`SELECT skill_id AS skillId, COUNT(*) AS answered,
      SUM(correct) AS correctCount FROM practice_answers
      WHERE session_id=? AND skill_id<>'' GROUP BY skill_id ORDER BY skill_id`)
      .all(row.id) as { skillId: string; answered: number; correctCount: number }[];
    return { id: row.id, gradeId: row.grade_id, subjectId: row.subject_id, topicId: row.topic_id,
      status: row.status, total: row.total, answered: row.answered, correctCount: row.correct_count,
      startedAt: row.started_at, completedAt: row.completed_at,
      targetDifficulty: row.target_difficulty === 2 ? 2 : 1,
      difficultyFallback: row.difficulty_fallback === 1, bankVersion: row.bank_version,
      skills };
  }
  const sessionQuery = `SELECT s.id,s.grade_id,s.subject_id,s.topic_id,s.status,s.total,s.started_at,s.completed_at,
      s.target_difficulty,s.difficulty_fallback,s.bank_version,
      COUNT(a.question_id) AS answered,COALESCE(SUM(a.correct),0) AS correct_count
      FROM practice_sessions s LEFT JOIN practice_answers a ON a.session_id=s.id`;
  function ownedPracticeSession(userId: string, sessionId: unknown): PracticeSession {
    activeUser(userId);
    if (typeof sessionId !== "string" || !/^[0-9a-f]{32}$/.test(sessionId)) throw new AuthError(400, "Sesión de práctica no válida.");
    const row = db.prepare(`${sessionQuery} WHERE s.id=? AND s.user_id=? GROUP BY s.id`).get(sessionId, userId) as PracticeSessionRow | undefined;
    if (!row) throw new AuthError(404, "Sesión de práctica no encontrada.");
    return sessionFromRow(row);
  }
  function snapshotQuestions(session: PracticeSession): PracticeQuestion[] {
    const rows = db.prepare("SELECT snapshot_json FROM practice_session_questions WHERE session_id=? ORDER BY position")
      .all(session.id) as { snapshot_json: string }[];
    if (rows.length) return rows.map((row) => JSON.parse(row.snapshot_json) as PracticeQuestion);
    // Sesiones creadas antes de este esquema: conservar sus dos preguntas
    // originales (los IDs 01 y 02), nunca ampliar una sesión ya iniciada.
    const legacy = getPracticeBank(session.gradeId, session.subjectId, session.topicId)?.slice(0, session.total);
    if (!legacy || legacy.length !== session.total) throw new AuthError(409, "El banco original de esta práctica ya no está disponible.");
    const insert = db.prepare("INSERT OR IGNORE INTO practice_session_questions(session_id,position,question_id,snapshot_json) VALUES (?,?,?,?)");
    legacy.forEach((question, index) => insert.run(session.id, index, question.id, JSON.stringify(question)));
    return legacy;
  }
  const oldAnswers = db.prepare(`SELECT a.session_id,a.question_id,s.grade_id,s.subject_id,s.topic_id
    FROM practice_answers a JOIN practice_sessions s ON s.id=a.session_id WHERE a.skill_id=''`)
    .all() as { session_id: string; question_id: string; grade_id: string; subject_id: string; topic_id: string }[];
  for (const answer of oldAnswers) {
    const skillId = getPracticeBank(answer.grade_id, answer.subject_id, answer.topic_id)
      ?.find((question) => question.id === answer.question_id)?.skillId;
    if (skillId) db.prepare("UPDATE practice_answers SET skill_id=? WHERE session_id=? AND question_id=?")
      .run(skillId, answer.session_id, answer.question_id);
  }
  function startPractice(userId: string, body: unknown) {
    activeUser(userId);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError(400, "Selección no válida.");
    const { gradeId, subjectId, topicId } = body as Record<string, unknown>;
    if (typeof gradeId !== "string" || typeof subjectId !== "string" || typeof topicId !== "string") throw new AuthError(400, "Selección no válida.");
    const bank = getPracticeBank(gradeId, subjectId, topicId);
    if (!bank || bank.length < 6) throw new AuthError(400, "No hay un banco suficiente para esa selección.");
    const id = randomBytes(16).toString("hex");
    const startedAt = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      const previousRow = db.prepare(`${sessionQuery} WHERE s.user_id=? AND s.topic_id=?
        GROUP BY s.id ORDER BY s.started_at DESC,s.id DESC LIMIT 1`)
        .get(userId, topicId) as PracticeSessionRow | undefined;
      const previous = previousRow ? sessionFromRow(previousRow) : null;
      if (previous?.status === "open") throw new AuthError(409, "Termina primero la ronda abierta de este tema.");
      const previousIds = new Set(previous ? snapshotQuestions(previous).map((question) => question.id) : []);
      const targetDifficulty: 1 | 2 = previous && previous.answered === previous.total &&
        previous.correctCount === previous.total ? 2 : 1;
      const selected = bank.filter((question) =>
        question.difficulty === targetDifficulty && !previousIds.has(question.id)).slice(0, 2);
      if (selected.length < 2) {
        throw new AuthError(409, `No quedan dos preguntas nuevas del nivel ${targetDifficulty} para otra ronda de este tema.`);
      }
      db.prepare(`INSERT INTO practice_sessions
        (id,user_id,grade_id,subject_id,topic_id,status,total,started_at,target_difficulty,difficulty_fallback,bank_version)
        VALUES (?,?,?,?,?,'open',?,?,?,?,?)`)
        .run(id, userId, gradeId, subjectId, topicId, selected.length, startedAt, targetDifficulty, 0, PRACTICE_BANK_VERSION);
      const insert = db.prepare("INSERT INTO practice_session_questions(session_id,position,question_id,snapshot_json) VALUES (?,?,?,?)");
      selected.forEach((question, index) => insert.run(id, index, question.id, JSON.stringify(question)));
      db.exec("COMMIT");
      return { session: ownedPracticeSession(userId, id), questions: publicPracticeQuestions(selected) };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  function getPracticeSession(userId: string, sessionId: unknown) {
    const session = ownedPracticeSession(userId, sessionId);
    const questions = snapshotQuestions(session);
    const rows = db.prepare(`SELECT question_id,option_id,correct,correct_option_id,explanation,skill_id,answered_at
      FROM practice_answers WHERE session_id=? ORDER BY answered_at,question_id`).all(session.id) as {
      question_id: string; option_id: string; correct: number; correct_option_id: string;
      explanation: string; skill_id: string; answered_at: string;
    }[];
    const answers: PracticeAnswer[] = rows.map((row) => {
      const explanation = correctionExplanation(row.explanation, null);
      return { questionId: row.question_id, optionId: row.option_id,
        correct: row.correct === 1, correctOptionId: row.correct_option_id,
        explanation: explanation.explanation, explanationStatus: explanation.status,
        skillId: row.skill_id, answeredAt: row.answered_at };
    });
    return { session, questions: publicPracticeQuestions(questions), answers };
  }
  function answerPractice(userId: string, body: unknown) {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError(400, "Respuesta no válida.");
    const { sessionId, questionId, optionId } = body as Record<string, unknown>;
    if (typeof questionId !== "string" || typeof optionId !== "string") throw new AuthError(400, "Respuesta no válida.");
    const session = ownedPracticeSession(userId, sessionId);
    if (session.status !== "open") throw new AuthError(409, "Esta práctica ya terminó.");
    const question = snapshotQuestions(session).find((item) => item.id === questionId);
    if (!question) throw new AuthError(400, "La pregunta no pertenece a esta práctica.");
    if (!question.options.some((option) => option.id === optionId)) throw new AuthError(400, "Selecciona una opción válida.");
    if (db.prepare("SELECT 1 FROM practice_answers WHERE session_id=? AND question_id=?").get(session.id, question.id)) {
      throw new AuthError(409, "Esta pregunta ya fue respondida.");
    }
    const correct = question.correctOptionId === optionId;
    const answeredAt = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      // Reconfirmar estado y duplicado dentro de la transacción mantiene la
      // corrección y el progreso sincronizados incluso ante solicitudes dobles.
      const current = ownedPracticeSession(userId, session.id);
      if (current.status !== "open" || db.prepare("SELECT 1 FROM practice_answers WHERE session_id=? AND question_id=?").get(session.id, question.id)) {
        throw new AuthError(409, "Esta práctica ya recibió esa respuesta.");
      }
      db.prepare(`INSERT INTO practice_answers(session_id,question_id,option_id,correct,correct_option_id,explanation,skill_id,answered_at)
        VALUES (?,?,?,?,?,?,?,?)`).run(session.id, question.id, optionId, correct ? 1 : 0,
        question.correctOptionId, question.explanation, question.skillId, answeredAt);
      const answered = Number((db.prepare("SELECT COUNT(*) AS count FROM practice_answers WHERE session_id=?").get(session.id) as { count: number }).count);
      if (answered === session.total) {
        db.prepare("UPDATE practice_sessions SET status='completed',completed_at=? WHERE id=?").run(answeredAt, session.id);
        db.prepare(`INSERT INTO progress(user_id,grade_id,subject_id,topic_id,kind,completed,updated_at)
          VALUES (?,?,?,?, 'study',1,?)
          ON CONFLICT(user_id,topic_id,kind) DO UPDATE SET completed=1,updated_at=excluded.updated_at`)
          .run(userId, session.gradeId, session.subjectId, session.topicId, answeredAt);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    const explanation = correctionExplanation(question.explanation, null);
    return { feedback: { correct, correctOptionId: question.correctOptionId,
        explanation: explanation.explanation, explanationStatus: explanation.status },
      session: ownedPracticeSession(userId, session.id) };
  }
  function listPracticeSessions(userId: string): PracticeSession[] {
    activeUser(userId);
    const rows = db.prepare(`SELECT * FROM (${sessionQuery} WHERE s.user_id=? GROUP BY s.id)
      ORDER BY started_at DESC,id DESC LIMIT 200`).all(userId) as PracticeSessionRow[];
    return rows.map(sessionFromRow);
  }
  function listPracticeSkillTotals(userId: string): {
    skillId: string; completeAttempts: number; answered: number; correctCount: number
  }[] {
    activeUser(userId);
    return db.prepare(`SELECT a.skill_id AS skillId,
        COUNT(DISTINCT a.session_id) AS completeAttempts,
        COUNT(*) AS answered, SUM(a.correct) AS correctCount
      FROM practice_answers a JOIN practice_sessions s ON s.id=a.session_id
      WHERE s.user_id=? AND s.status='completed' AND a.skill_id<>''
        AND (SELECT COUNT(*) FROM practice_answers all_answers WHERE all_answers.session_id=s.id)=s.total
      GROUP BY a.skill_id ORDER BY a.skill_id`).all(userId) as {
      skillId: string; completeAttempts: number; answered: number; correctCount: number
    }[];
  }
  function finishPractice(userId: string, body: unknown): PracticeSession {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError(400, "Sesión de práctica no válida.");
    const session = ownedPracticeSession(userId, (body as Record<string, unknown>).sessionId);
    if (session.status === "completed") return session;
    db.prepare("UPDATE practice_sessions SET status='completed',completed_at=? WHERE id=? AND user_id=? AND status='open'")
      .run(new Date().toISOString(), session.id, userId);
    return ownedPracticeSession(userId, session.id);
  }
  return { register, login, sessionUser, logout, disableUser, saveProgress, listProgress,
    startPractice, answerPractice, finishPractice, getPracticeSession, listPracticeSessions,
    listPracticeSkillTotals, close: () => db.close() };
}

type Store = ReturnType<typeof openAuthStore>;
let singleton: Store | undefined;
export function authStore() { return singleton ??= openAuthStore(); }
