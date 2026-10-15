import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";
import { topics } from "./catalog.ts";

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
    );`);

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
        (kind !== "study" && kind !== "diagnostic") || completed !== true ||
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
  return { register, login, sessionUser, logout, disableUser, saveProgress, listProgress, close: () => db.close() };
}

type Store = ReturnType<typeof openAuthStore>;
let singleton: Store | undefined;
export function authStore() { return singleton ??= openAuthStore(); }
