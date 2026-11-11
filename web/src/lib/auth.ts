import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";
import { topics } from "./catalog.ts";
import { getPracticeBank, publicPracticeQuestions, PRACTICE_BANK_VERSION, PRACTICE_SKILL_CORRECTIONS, CURRENT_PRACTICE_SKILL_CORRECTIONS, type PracticeQuestion } from "./practice.ts";
import { correctionExplanation } from "./practice-feedback.ts";
import { availableSelection, recommendStudy, studyStreak, type SavedSelection } from "./study-planning.ts";
import { profileInput, type AccountProfile } from "./profile.ts";
import { AuthError } from "./auth-error.ts";
import { openPostgresAuthStore } from "./auth-postgres.ts";
export { AuthError } from "./auth-error.ts";

const scrypt = promisify(scryptCallback);
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const RESET_LIFETIME_MS = 30 * 60 * 1000;
const VERIFY_LIFETIME_MS = 24 * 60 * 60 * 1000;
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
      adult_confirmed INTEGER NOT NULL CHECK(adult_confirmed = 1), created_at TEXT NOT NULL,
      email_verified_at TEXT
    );
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL, grade_id TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pending_registrations (
      email TEXT PRIMARY KEY, salt TEXT NOT NULL, password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL, grade_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS email_verification_limits (
      email_hash TEXT PRIMARY KEY, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_by_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS password_reset_limits (
      email_hash TEXT PRIMARY KEY, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS progress (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      grade_id TEXT NOT NULL, subject_id TEXT NOT NULL, topic_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('study','diagnostic')),
      completed INTEGER NOT NULL CHECK(completed = 1), updated_at TEXT NOT NULL,
      PRIMARY KEY(user_id, topic_id, kind)
    );
    CREATE TABLE IF NOT EXISTS last_selections (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      grade_id TEXT NOT NULL, subject_id TEXT NOT NULL, topic_id TEXT NOT NULL,
      selected_at TEXT NOT NULL
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

  const userColumns = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!userColumns.some((column) => column.name === "email_verified_at")) {
    db.exec("ALTER TABLE users ADD COLUMN email_verified_at TEXT");
  }
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
  async function requestRegistration(body: unknown, deliver: (email: string, token: string) => Promise<void>, now = Date.now()) {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError(400, "Solicitud no válida.");
    const data = body as Record<string, unknown>;
    if (data.adultConfirmed !== true) throw new AuthError(403, "El registro de menores aún no está disponible.");
    if (Object.keys(data).some((key) => !["email", "password", "adultConfirmed", "displayName", "gradeId"].includes(key))) {
      throw new AuthError(400, "Datos adicionales no permitidos.");
    }
    const email = normalizedEmail(data.email);
    const password = validPassword(data.password);
    const profile = profileInput({ displayName: data.displayName, gradeId: data.gradeId });
    if (!profile) throw new AuthError(400, "Nombre o grado no válido.");
    db.prepare("DELETE FROM pending_registrations WHERE expires_at<=?").run(now);
    db.prepare("DELETE FROM email_verification_limits WHERE window_start<?").run(now - 86400000);
    const key = sha256(email);
    const limit = db.prepare("SELECT window_start AS windowStart,attempts FROM email_verification_limits WHERE email_hash=?")
      .get(key) as { windowStart: number; attempts: number } | undefined;
    if (limit && now - limit.windowStart < 3600000 && limit.attempts >= 3) return;
    if (!limit || now - limit.windowStart >= 3600000) {
      db.prepare(`INSERT INTO email_verification_limits(email_hash,window_start,attempts) VALUES (?,?,1)
        ON CONFLICT(email_hash) DO UPDATE SET window_start=excluded.window_start,attempts=1`).run(key, now);
    } else db.prepare("UPDATE email_verification_limits SET attempts=attempts+1 WHERE email_hash=?").run(key);
    if (db.prepare("SELECT id FROM users WHERE email=?").get(email)) return;
    const pending = db.prepare("SELECT token_hash AS tokenHash,expires_at AS expiresAt FROM pending_registrations WHERE email=?")
      .get(email) as { tokenHash: string; expiresAt: number } | undefined;
    const token = randomBytes(32).toString("hex");
    const tokenHash = sha256(token);
    if (pending) {
      db.prepare("UPDATE pending_registrations SET token_hash=?,expires_at=? WHERE email=?")
        .run(tokenHash, now + VERIFY_LIFETIME_MS, email);
    } else {
      const salt = randomBytes(16).toString("hex");
      const hash = (await passwordHash(password, salt)).toString("hex");
      db.prepare(`INSERT INTO pending_registrations(email,salt,password_hash,display_name,grade_id,token_hash,expires_at,created_at)
        VALUES (?,?,?,?,?,?,?,?)`).run(email, salt, hash, profile.displayName, profile.gradeId,
          tokenHash, now + VERIFY_LIFETIME_MS, new Date(now).toISOString());
    }
    try { await deliver(email, token); }
    catch (error) {
      if (pending) db.prepare("UPDATE pending_registrations SET token_hash=?,expires_at=? WHERE email=? AND token_hash=?")
        .run(pending.tokenHash, pending.expiresAt, email, tokenHash);
      else db.prepare("DELETE FROM pending_registrations WHERE email=? AND token_hash=?").run(email, tokenHash);
      db.prepare("UPDATE email_verification_limits SET attempts=MAX(0,attempts-1) WHERE email_hash=?").run(key);
      throw error;
    }
  }
  function verifyRegistration(body: unknown, now = Date.now()) {
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).some((key) => key !== "token")) throw new AuthError(400, "Enlace no válido.");
    const token = (body as Record<string, unknown>).token;
    if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) throw new AuthError(400, "El enlace ya no es válido. Solicita uno nuevo.");
    const tokenHash = sha256(token);
    const pending = db.prepare("SELECT * FROM pending_registrations WHERE token_hash=? AND expires_at>?")
      .get(tokenHash, now) as { email: string; salt: string; password_hash: string; display_name: string; grade_id: string } | undefined;
    if (!pending) throw new AuthError(400, "Enlace no válido o vencido.");
    const id = randomBytes(16).toString("hex");
    const timestamp = new Date(now).toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      if (db.prepare("DELETE FROM pending_registrations WHERE token_hash=? AND expires_at>?").run(tokenHash, now).changes !== 1) {
        throw new AuthError(400, "Enlace no válido o vencido.");
      }
      db.prepare("INSERT INTO users(id,email,salt,password_hash,adult_confirmed,created_at,email_verified_at) VALUES (?,?,?,?,1,?,?)")
        .run(id, pending.email, pending.salt, pending.password_hash, timestamp, timestamp);
      db.prepare("INSERT INTO user_profiles(user_id,display_name,grade_id,updated_at) VALUES (?,?,?,?)")
        .run(id, pending.display_name, pending.grade_id, timestamp);
      db.prepare("DELETE FROM email_verification_limits WHERE email_hash=?").run(sha256(pending.email));
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
    return { user: { id, email: pending.email }, token: createSession(id) };
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
  function getProfile(userId: string): AccountProfile | null {
    const row = db.prepare(`SELECT p.display_name AS displayName,p.grade_id AS gradeId,p.updated_at AS updatedAt
      FROM user_profiles p JOIN users u ON u.id=p.user_id WHERE p.user_id=? AND u.status='active'`)
      .get(userId) as Omit<AccountProfile, "role"> | undefined;
    return row ? { role: "adult_student", ...row } : null;
  }
  function assertCurrentGrade(userId: string, gradeId: unknown): string {
    const profile = getProfile(userId);
    if (!profile) throw new AuthError(409, "Completa tu perfil y elige tu grado antes de estudiar.");
    if (profile.gradeId !== gradeId) throw new AuthError(403, "Este tema no corresponde al grado de tu perfil.");
    return profile.gradeId;
  }
  function saveProfile(userId: string, body: unknown): AccountProfile {
    const input = profileInput(body);
    if (!input) throw new AuthError(400, "Nombre o grado no válido.");
    const active = db.prepare("SELECT id FROM users WHERE id=? AND status='active'").get(userId);
    if (!active) throw new AuthError(401, "Sesión requerida.");
    const previousGradeId = getProfile(userId)?.gradeId;
    const lastSelection = db.prepare("SELECT grade_id AS gradeId FROM last_selections WHERE user_id=?")
      .get(userId) as { gradeId: string } | undefined;
    const updatedAt = new Date().toISOString();
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(`INSERT INTO user_profiles(user_id,display_name,grade_id,updated_at) VALUES (?,?,?,?)
        ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,grade_id=excluded.grade_id,updated_at=excluded.updated_at`)
        .run(userId, input.displayName, input.gradeId, updatedAt);
      if (previousGradeId !== input.gradeId || lastSelection?.gradeId !== input.gradeId) {
        db.prepare("DELETE FROM last_selections WHERE user_id=?").run(userId);
      }
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
    return { role: "adult_student", ...input, updatedAt };
  }
  function logout(token: string | null | undefined) {
    if (token && /^[0-9a-f]{64}$/.test(token)) db.prepare("DELETE FROM sessions WHERE token_hash=?").run(sha256(token));
  }
  function disableUser(userId: string) {
    db.prepare("UPDATE users SET status='disabled' WHERE id=?").run(userId);
    db.prepare("DELETE FROM sessions WHERE user_id=?").run(userId);
  }
  async function requestPasswordReset(body: unknown, deliver: (email: string, token: string) => Promise<void>, now = Date.now()) {
    if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => key !== "email")) throw new AuthError(400, "Solicitud no válida.");
    const email = normalizedEmail((body as Record<string, unknown>).email);
    const key = sha256(email);
    db.prepare("DELETE FROM password_reset_limits WHERE window_start<?").run(now - 86400000);
    const limit = db.prepare("SELECT window_start AS windowStart,attempts FROM password_reset_limits WHERE email_hash=?")
      .get(key) as { windowStart: number; attempts: number } | undefined;
    if (!limit || now - limit.windowStart >= 3600000) {
      db.prepare("INSERT INTO password_reset_limits(email_hash,window_start,attempts) VALUES (?,?,1) ON CONFLICT(email_hash) DO UPDATE SET window_start=excluded.window_start,attempts=1")
        .run(key, now);
    } else {
      if (limit.attempts >= 3) return;
      db.prepare("UPDATE password_reset_limits SET attempts=attempts+1 WHERE email_hash=?").run(key);
    }
    const row = db.prepare("SELECT id FROM users WHERE email=? AND status='active'").get(email) as { id: string } | undefined;
    if (!row) return;
    const token = randomBytes(32).toString("hex");
    const tokenHash = sha256(token);
    db.prepare("DELETE FROM password_reset_tokens WHERE user_id=? OR expires_at<=?").run(row.id, now);
    db.prepare("INSERT INTO password_reset_tokens(token_hash,user_id,expires_at,created_at) VALUES (?,?,?,?)")
      .run(tokenHash, row.id, now + RESET_LIFETIME_MS, new Date(now).toISOString());
    try { await deliver(email, token); }
    catch (error) {
      db.prepare("DELETE FROM password_reset_tokens WHERE token_hash=?").run(tokenHash);
      throw error;
    }
  }
  async function resetPassword(body: unknown, now = Date.now()) {
    if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => !["token", "password"].includes(key))) throw new AuthError(400, "Solicitud no válida.");
    const { token, password: supplied } = body as Record<string, unknown>;
    if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) throw new AuthError(400, "Enlace no válido o vencido.");
    const password = validPassword(supplied);
    const tokenHash = sha256(token);
    const row = db.prepare(`SELECT t.user_id AS userId,t.expires_at AS expiresAt FROM password_reset_tokens t
      JOIN users u ON u.id=t.user_id WHERE t.token_hash=? AND u.status='active'`).get(tokenHash) as
      { userId: string; expiresAt: number } | undefined;
    if (!row || row.expiresAt <= now) throw new AuthError(400, "El enlace ya no es válido. Solicita uno nuevo.");
    const salt = randomBytes(16).toString("hex");
    const hash = (await passwordHash(password, salt)).toString("hex");
    db.exec("BEGIN IMMEDIATE");
    try {
      const consumed = db.prepare("DELETE FROM password_reset_tokens WHERE token_hash=? AND expires_at>?")
        .run(tokenHash, now);
      if (consumed.changes !== 1) throw new AuthError(400, "El enlace ya no es válido. Solicita uno nuevo.");
      db.prepare("UPDATE users SET salt=?,password_hash=? WHERE id=? AND status='active'").run(salt, hash, row.userId);
      db.prepare("DELETE FROM password_reset_tokens WHERE user_id=?").run(row.userId);
      db.prepare("DELETE FROM sessions WHERE user_id=?").run(row.userId);
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  }
  async function deleteOwnAccount(userId: string, body: unknown) {
    activeUser(userId);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => !["confirmation", "password"].includes(key))) throw new AuthError(400, "Solicitud no válida.");
    const { confirmation, password } = body as Record<string, unknown>;
    if (confirmation !== "ELIMINAR" || typeof password !== "string") throw new AuthError(400, "Confirma la eliminación con tu contraseña.");
    const row = db.prepare("SELECT id,email,salt,password_hash,status FROM users WHERE id=? AND status='active'").get(userId) as UserRow;
    const candidate = await passwordHash(password, row.salt);
    if (!timingSafeEqual(candidate, Buffer.from(row.password_hash, "hex"))) throw new AuthError(401, "Contraseña incorrecta.");
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("DELETE FROM password_reset_limits WHERE email_hash=?").run(sha256(row.email));
      db.prepare("DELETE FROM email_verification_limits WHERE email_hash=?").run(sha256(row.email));
      db.prepare("DELETE FROM pending_registrations WHERE email=?").run(row.email);
      if (db.prepare("DELETE FROM users WHERE id=? AND status='active'").run(userId).changes !== 1) {
        throw new AuthError(401, "Sesión no válida.");
      }
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
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
    // El progreso diagnóstico se registra desde el servidor tras cerrar un
    // intento; el cliente no puede declararlo completado mediante /api/progress.
    throw new AuthError(409, "Completa un intento diagnóstico para registrar el resultado.");
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
  function getLastSelection(userId: string): { selection: SavedSelection | null; unavailable: boolean } {
    activeUser(userId);
    const row = db.prepare("SELECT grade_id AS gradeId,subject_id AS subjectId,topic_id AS topicId FROM last_selections WHERE user_id=?")
      .get(userId) as SavedSelection | undefined;
    const profileGradeId = getProfile(userId)?.gradeId;
    const selection = row?.gradeId === profileGradeId ? availableSelection(row) : null;
    return { selection, unavailable: !!row && !selection };
  }
  function saveLastSelection(userId: string, body: unknown): SavedSelection {
    activeUser(userId);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
      Object.keys(body).some((key) => !["gradeId", "subjectId", "topicId"].includes(key))) {
      throw new AuthError(400, "Selección no válida.");
    }
    const selection = availableSelection(body);
    if (selection) assertCurrentGrade(userId, selection.gradeId);
    if (!selection) throw new AuthError(400, "El tema ya no está disponible. Elige otro.");
    db.prepare(`INSERT INTO last_selections(user_id,grade_id,subject_id,topic_id,selected_at)
      VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET grade_id=excluded.grade_id,
      subject_id=excluded.subject_id,topic_id=excluded.topic_id,selected_at=excluded.selected_at`)
      .run(userId, selection.gradeId, selection.subjectId, selection.topicId, new Date().toISOString());
    return selection;
  }
  function studySummary(userId: string, now = new Date()) {
    activeUser(userId);
    const lastSelection = getLastSelection(userId);
    const completedDates = db.prepare(`SELECT s.completed_at AS completedAt FROM practice_sessions s
      WHERE s.user_id=? AND s.status='completed' AND s.completed_at IS NOT NULL
        AND EXISTS (SELECT 1 FROM practice_answers a WHERE a.session_id=s.id)`)
      .all(userId) as { completedAt: string }[];
    const gradeId = getProfile(userId)?.gradeId;
    const firstTopic = topics.find((topic) => topic.gradeId === gradeId && topic.active && topic.pilotCandidate);
    const currentSelection = lastSelection.selection ?? (firstTopic
      ? { gradeId: firstTopic.gradeId, subjectId: firstTopic.subjectId, topicId: firstTopic.id } : null);
    return { recommendation: recommendStudy(currentSelection, listPracticeSkillTotals(userId)),
      streak: studyStreak(completedDates.map((row) => row.completedAt), now) };
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
    const oldMath10: PracticeQuestion[] = [
      { id: "practice-g10-mat-01", topicId: "G10-MAT",
        prompt: "¿Cuánto vale el seno si el opuesto es 3 y la hipotenusa 5?",
        options: [{ id: "a", text: "3/5" }, { id: "b", text: "5/3" }, { id: "c", text: "4/5" }],
        correctOptionId: "a", explanation: "El seno compara el cateto opuesto con la hipotenusa: 3 dividido entre 5.",
        difficulty: 1, skillId: "G10-MAT:seno", provisional: true },
      { id: "practice-g10-mat-02", topicId: "G10-MAT",
        prompt: "En un triángulo rectángulo, si el cateto opuesto mide 5 y la hipotenusa 13, ¿cuál es el seno?",
        options: [{ id: "a", text: "5/13" }, { id: "b", text: "13/5" }, { id: "c", text: "12/13" }],
        correctOptionId: "a", explanation: "El seno se calcula como opuesto dividido entre hipotenusa.",
        difficulty: 1, skillId: "G10-MAT:seno", provisional: true },
    ];
    const legacy = session.bankVersion !== PRACTICE_BANK_VERSION && session.topicId === "G10-MAT" && session.total === 2
      ? oldMath10 : getPracticeBank(session.gradeId, session.subjectId, session.topicId)?.slice(0, session.total);
    if (!legacy || legacy.length !== session.total) throw new AuthError(409, "El banco original de esta práctica ya no está disponible.");
    const insert = db.prepare("INSERT OR IGNORE INTO practice_session_questions(session_id,position,question_id,snapshot_json) VALUES (?,?,?,?)");
    legacy.forEach((question, index) => insert.run(session.id, index, question.id, JSON.stringify(question)));
    return legacy;
  }
  const oldAnswers = db.prepare(`SELECT a.session_id,a.question_id,s.grade_id,s.subject_id,s.topic_id,s.bank_version,q.snapshot_json
    FROM practice_answers a JOIN practice_sessions s ON s.id=a.session_id
    LEFT JOIN practice_session_questions q ON q.session_id=a.session_id AND q.question_id=a.question_id
    WHERE a.skill_id=''`)
    .all() as { session_id: string; question_id: string; grade_id: string; subject_id: string; topic_id: string;
      bank_version: string; snapshot_json: string | null }[];
  const oldMathSkills: Readonly<Record<string, string>> = {
    "practice-g10-mat-01": "G10-MAT:seno", "practice-g10-mat-02": "G10-MAT:seno",
    "practice-g10-mat-03": "G10-MAT:seno", "practice-g10-mat-04": "G10-MAT:coseno",
    "practice-g10-mat-05": "G10-MAT:seno", "practice-g10-mat-06": "G10-MAT:coseno",
  };
  for (const answer of oldAnswers) {
    const isCurrent = answer.bank_version === PRACTICE_BANK_VERSION;
    const snapshotSkill = answer.snapshot_json ? (JSON.parse(answer.snapshot_json) as PracticeQuestion).skillId : null;
    const skillId = (isCurrent ? CURRENT_PRACTICE_SKILL_CORRECTIONS : PRACTICE_SKILL_CORRECTIONS)[answer.question_id]
      ?? (isCurrent ? snapshotSkill : oldMathSkills[answer.question_id] ?? snapshotSkill)
      ?? getPracticeBank(answer.grade_id, answer.subject_id, answer.topic_id)
        ?.find((question) => question.id === answer.question_id)?.skillId;
    if (skillId) db.prepare("UPDATE practice_answers SET skill_id=? WHERE session_id=? AND question_id=?")
      .run(skillId, answer.session_id, answer.question_id);
  }
  // Corrige solo la clasificación histórica: conserva la pregunta, la clave y
  // la respuesta originales que quedaron guardadas en cada sesión.
  const reclassify = db.prepare(`UPDATE practice_answers SET skill_id=? WHERE question_id=? AND skill_id<>?
    AND (?<>'practice-g10-mat-02' OR EXISTS (
      SELECT 1 FROM practice_sessions s WHERE s.id=practice_answers.session_id AND s.bank_version<>?))`);
  for (const [questionId, skillId] of Object.entries(PRACTICE_SKILL_CORRECTIONS)) {
    reclassify.run(skillId, questionId, skillId, questionId, PRACTICE_BANK_VERSION);
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
        question.correctOptionId, question.explanation,
        (session.bankVersion === PRACTICE_BANK_VERSION
          ? CURRENT_PRACTICE_SKILL_CORRECTIONS[question.id]
          : PRACTICE_SKILL_CORRECTIONS[question.id]) ?? question.skillId, answeredAt);
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
  function listPracticeComparisonSessions(userId: string) {
    activeUser(userId);
    return db.prepare(`WITH scored AS (
      SELECT s.id, s.grade_id AS gradeId, s.subject_id AS subjectId,
        s.topic_id AS topicId, s.completed_at AS completedAt,
        COUNT(a.question_id) AS answered, COALESCE(SUM(a.correct),0) AS correctCount
      FROM practice_sessions s LEFT JOIN practice_answers a ON a.session_id=s.id
      WHERE s.user_id=? AND s.status='completed' AND s.completed_at IS NOT NULL
      GROUP BY s.id HAVING COUNT(a.question_id)>0
    ), ranked AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY topicId ORDER BY completedAt DESC,id DESC) AS position FROM scored
    )
    SELECT id,gradeId,subjectId,topicId,'completed' AS status,completedAt,answered,correctCount
    FROM ranked WHERE position<=2 ORDER BY completedAt DESC,id DESC`).all(userId);
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
  return { register, requestRegistration, verifyRegistration, login, sessionUser, getProfile, assertCurrentGrade, saveProfile,
    logout, disableUser, requestPasswordReset, resetPassword,
    deleteOwnAccount, saveProgress, listProgress,
    getLastSelection, saveLastSelection, studySummary,
    startPractice, answerPractice, finishPractice, getPracticeSession, listPracticeSessions,
    listPracticeComparisonSessions,
    listPracticeSkillTotals, close: () => db.close() };
}

type Store = ReturnType<typeof openAuthStore>;
let singleton: Store | undefined;
let postgresSingleton: ReturnType<typeof openPostgresAuthStore> | undefined;
export function authStore() {
  return process.env.DATABASE_URL
    ? postgresSingleton ??= openPostgresAuthStore()
    : singleton ??= openAuthStore();
}
