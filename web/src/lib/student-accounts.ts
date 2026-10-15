import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const REQUIRED_PURPOSES = ["educational_account", "progress_storage"] as const;
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILURES = 5;
const REGISTRATION_ERROR = "Revisa los datos e inténtalo de nuevo.";
const LOGIN_ERROR = "No pudimos iniciar sesión. Revisa tus datos e inténtalo de nuevo.";

export class StudentAccountError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

/** Supplied only by a future, independently reviewed representative-verification service. */
export type VerifiedAuthorization = {
  representativeRef: string;
  verificationMethod: string;
  evidenceRef: string;
  studentHeard: true;
  noticeVersion: string;
  noticeDigest: string;
  purposes: readonly string[];
  verifiedAt: string;
};

export type ReviewedConsentPolicy = {
  noticeVersion: string;
  noticeDigest: string;
  approvedMethod: string;
};

export type StudentProgress = {
  id: string;
  sourceSessionId: string;
  topicId: string;
  kind: "diagnostic" | "practice";
  correctCount: number;
  answered: number;
  completedAt: string;
};

export type CompletedStudentSession = Omit<StudentProgress, "id" | "sourceSessionId"> & {
  sessionId: string;
  studentId: string;
  status: "completed";
};
export type CompletedSessionResolver = (sessionId: string, studentId: string) => CompletedStudentSession | null;

function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function validEmail(value: unknown) {
  if (typeof value !== "string") throw new StudentAccountError(400, "Revisa los datos e inténtalo de nuevo.");
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 5 || normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new StudentAccountError(400, "Revisa los datos e inténtalo de nuevo.");
  }
  return normalized;
}
function validPassword(value: unknown) {
  if (typeof value !== "string" || value.length < 12 || value.length > 128) {
    throw new StudentAccountError(400, "Revisa los datos e inténtalo de nuevo.");
  }
  return value;
}
function validUtc(value: string) {
  return /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value) && !Number.isNaN(Date.parse(value));
}
function policyMatches(grant: VerifiedAuthorization, policy: ReviewedConsentPolicy) {
  if (!grant || typeof grant !== "object" || !Array.isArray(grant.purposes)) return false;
  return grant.noticeVersion === policy.noticeVersion && grant.noticeDigest === policy.noticeDigest &&
    grant.verificationMethod === policy.approvedMethod && grant.studentHeard === true &&
    /^[0-9a-f]{64}$/.test(grant.noticeDigest) &&
    [grant.representativeRef, grant.evidenceRef].every((value) => typeof value === "string" && value.length > 0 && value.length <= 200) &&
    REQUIRED_PURPOSES.every((purpose) => grant.purposes.includes(purpose)) &&
    validUtc(grant.verifiedAt) && Date.parse(grant.verifiedAt) <= Date.now();
}

/**
 * Internal store. Public routes must not call issueAuthorization until legal review
 * and representative verification have been integrated. The browser cannot
 * create VerifiedAuthorization or select a ReviewedConsentPolicy.
 */
export function openStudentAccountStore(
  dbPath = process.env.APOYO_STUDENT_DB_PATH || path.join(process.cwd(), "data", "apoyo-students.sqlite"),
  reviewedPolicy: ReviewedConsentPolicy | null = null,
  resolveCompletedSession: CompletedSessionResolver | null = null,
) {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS student_consents (
      id TEXT PRIMARY KEY, representative_ref TEXT NOT NULL, verification_method TEXT NOT NULL,
      evidence_ref TEXT NOT NULL UNIQUE, notice_version TEXT NOT NULL, notice_digest TEXT NOT NULL,
      purposes TEXT NOT NULL, student_heard INTEGER NOT NULL CHECK(student_heard = 1),
      verified_at TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('active','revoked')),
      revoked_at TEXT
    );
    CREATE TABLE IF NOT EXISTS student_users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL, consent_id TEXT NOT NULL UNIQUE REFERENCES student_consents(id),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS student_sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES student_users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS student_login_failures (
      email_hash TEXT PRIMARY KEY, failures INTEGER NOT NULL, first_failed_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS student_progress (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES student_users(id) ON DELETE CASCADE,
      source_session_id TEXT NOT NULL UNIQUE,
      topic_id TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('diagnostic','practice')),
      correct_count INTEGER NOT NULL, answered INTEGER NOT NULL, completed_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS student_progress_owner ON student_progress(user_id,topic_id,completed_at);`);

  function requireReviewedPolicy() {
    // Formal approval has not arrived. A deployment cannot turn this on with an
    // environment variable or an arbitrary policy object: release needs a code change.
    if (process.env.NODE_ENV === "production" || !reviewedPolicy) {
      throw new StudentAccountError(503, "Las cuentas de estudiantes aún no están disponibles.");
    }
    return reviewedPolicy;
  }
  function issueAuthorization(grant: VerifiedAuthorization) {
    const policy = requireReviewedPolicy();
    if (!policyMatches(grant, policy)) throw new StudentAccountError(403, "Autorización requerida.");
    const id = randomBytes(16).toString("hex");
    try {
      db.prepare(`INSERT INTO student_consents
        (id,representative_ref,verification_method,evidence_ref,notice_version,notice_digest,purposes,student_heard,verified_at,status)
        VALUES (?,?,?,?,?,?,?,?,?,'active')`).run(id, grant.representativeRef, grant.verificationMethod,
        grant.evidenceRef, grant.noticeVersion, grant.noticeDigest, JSON.stringify([...new Set(grant.purposes)]), 1, grant.verifiedAt);
    } catch (error) {
      if (String(error).includes("UNIQUE constraint failed")) throw new StudentAccountError(403, "Autorización requerida.");
      throw error;
    }
    return id;
  }
  function consentActive(consentId: string) {
    const row = db.prepare("SELECT status,notice_version,notice_digest,verification_method,purposes FROM student_consents WHERE id=?")
      .get(consentId) as { status: string; notice_version: string; notice_digest: string; verification_method: string; purposes: string } | undefined;
    const policy = requireReviewedPolicy();
    if (!row || row.status !== "active" || row.notice_version !== policy.noticeVersion ||
      row.notice_digest !== policy.noticeDigest || row.verification_method !== policy.approvedMethod ||
      !REQUIRED_PURPOSES.every((purpose) => (JSON.parse(row.purposes) as string[]).includes(purpose))) {
      throw new StudentAccountError(403, "Autorización requerida.");
    }
  }
  async function register(body: unknown) {
    requireReviewedPolicy();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new StudentAccountError(400, "Revisa los datos e inténtalo de nuevo.");
    const data = body as Record<string, unknown>;
    if (Object.keys(data).some((key) => !["email", "password", "authorizationId"].includes(key)) ||
      typeof data.authorizationId !== "string" || !/^[0-9a-f]{32}$/.test(data.authorizationId)) {
      throw new StudentAccountError(400, "Revisa los datos e inténtalo de nuevo.");
    }
    const email = validEmail(data.email);
    const password = validPassword(data.password);
    const salt = randomBytes(16).toString("hex");
    const passwordHash = (await scrypt(password, salt, 64) as Buffer).toString("hex");
    const id = randomBytes(16).toString("hex");
    db.exec("BEGIN IMMEDIATE");
    try {
      consentActive(data.authorizationId);
      db.prepare(`INSERT INTO student_users(id,email,password_salt,password_hash,consent_id,created_at)
        VALUES (?,?,?,?,?,?)`).run(id, email, salt, passwordHash, data.authorizationId, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      if (String(error).includes("UNIQUE constraint failed")) throw new StudentAccountError(400, REGISTRATION_ERROR);
      throw error;
    }
    return { id, email };
  }
  async function registerAuthorized(body: unknown, grant: VerifiedAuthorization) {
    const policy = requireReviewedPolicy();
    if (!policyMatches(grant, policy)) throw new StudentAccountError(403, "Autorización requerida.");
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).some((key) => !["email", "password"].includes(key))) {
      throw new StudentAccountError(400, REGISTRATION_ERROR);
    }
    const data = body as Record<string, unknown>;
    const email = validEmail(data.email);
    const password = validPassword(data.password);
    const salt = randomBytes(16).toString("hex");
    const passwordHash = (await scrypt(password, salt, 64) as Buffer).toString("hex");
    const consentId = randomBytes(16).toString("hex");
    const id = randomBytes(16).toString("hex");
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare(`INSERT INTO student_consents
        (id,representative_ref,verification_method,evidence_ref,notice_version,notice_digest,purposes,student_heard,verified_at,status)
        VALUES (?,?,?,?,?,?,?,?,?,'active')`).run(consentId, grant.representativeRef, grant.verificationMethod,
        grant.evidenceRef, grant.noticeVersion, grant.noticeDigest,
        JSON.stringify([...new Set(grant.purposes)]), 1, grant.verifiedAt);
      db.prepare(`INSERT INTO student_users(id,email,password_salt,password_hash,consent_id,created_at)
        VALUES (?,?,?,?,?,?)`).run(id, email, salt, passwordHash, consentId, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      if (String(error).includes("UNIQUE constraint failed")) throw new StudentAccountError(400, REGISTRATION_ERROR);
      throw error;
    }
    return { id, email };
  }
  async function login(body: unknown) {
    requireReviewedPolicy();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new StudentAccountError(401, LOGIN_ERROR);
    const data = body as Record<string, unknown>;
    let email: string;
    try { email = validEmail(data.email); }
    catch { throw new StudentAccountError(401, LOGIN_ERROR); }
    if (typeof data.password !== "string" || data.password.length > 128) throw new StudentAccountError(401, LOGIN_ERROR);
    const emailHash = hash(email);
    const now = Date.now();
    const failures = db.prepare("SELECT failures,first_failed_at FROM student_login_failures WHERE email_hash=?")
      .get(emailHash) as { failures: number; first_failed_at: number } | undefined;
    if (failures && failures.first_failed_at > now - LOGIN_WINDOW_MS && failures.failures >= MAX_LOGIN_FAILURES) {
      throw new StudentAccountError(429, LOGIN_ERROR);
    }
    const row = db.prepare(`SELECT u.id,u.email,u.password_salt,u.password_hash,u.consent_id
      FROM student_users u WHERE u.email=?`).get(email) as {
      id: string; email: string; password_salt: string; password_hash: string; consent_id: string
    } | undefined;
    const candidate = (await scrypt(data.password, row?.password_salt ?? "00000000000000000000000000000000", 64)) as Buffer;
    const expected = Buffer.from(row?.password_hash ?? "00".repeat(64), "hex");
    if (!row || !timingSafeEqual(candidate, expected)) {
      db.prepare(`INSERT INTO student_login_failures(email_hash,failures,first_failed_at) VALUES (?,1,?)
        ON CONFLICT(email_hash) DO UPDATE SET failures=CASE
          WHEN first_failed_at<=? THEN 1 ELSE failures+1 END,
          first_failed_at=CASE WHEN first_failed_at<=? THEN excluded.first_failed_at ELSE first_failed_at END`)
        .run(emailHash, now, now - LOGIN_WINDOW_MS, now - LOGIN_WINDOW_MS);
      throw new StudentAccountError(401, LOGIN_ERROR);
    }
    consentActive(row.consent_id);
    const token = randomBytes(32).toString("hex");
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("DELETE FROM student_login_failures WHERE email_hash=?").run(emailHash);
      db.prepare("INSERT INTO student_sessions(token_hash,user_id,expires_at) VALUES (?,?,?)")
        .run(hash(token), row.id, Date.now() + SESSION_MS);
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
    return { user: { id: row.id, email: row.email }, token };
  }
  function currentStudent(token: string | null) {
    requireReviewedPolicy();
    if (!token || !/^[0-9a-f]{64}$/.test(token)) throw new StudentAccountError(401, "Sesión requerida.");
    const row = db.prepare(`SELECT u.id,u.email,u.consent_id FROM student_sessions s
      JOIN student_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?`)
      .get(hash(token), Date.now()) as { id: string; email: string; consent_id: string } | undefined;
    if (!row) throw new StudentAccountError(401, "Sesión requerida.");
    consentActive(row.consent_id);
    return { id: row.id, email: row.email };
  }
  function logout(token: string | null) {
    if (token && /^[0-9a-f]{64}$/.test(token)) db.prepare("DELETE FROM student_sessions WHERE token_hash=?").run(hash(token));
  }
  function revoke(authorizationId: string) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.prepare("UPDATE student_consents SET status='revoked',revoked_at=? WHERE id=? AND status='active'")
        .run(new Date().toISOString(), authorizationId);
      db.prepare("DELETE FROM student_sessions WHERE user_id IN (SELECT id FROM student_users WHERE consent_id=?)")
        .run(authorizationId);
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  }
  function recordCompletedSession(token: string, sessionId: string) {
    if (typeof sessionId !== "string" || !/^[0-9a-f]{32}$/.test(sessionId)) {
      throw new StudentAccountError(400, "Sesión no válida.");
    }
    if (!resolveCompletedSession) throw new StudentAccountError(503, "El seguimiento de estudiantes aún no está disponible.");
    db.exec("BEGIN IMMEDIATE");
    try {
      const user = currentStudent(token);
      const item = resolveCompletedSession(sessionId, user.id);
      if (!item || item.studentId !== user.id || item.sessionId !== sessionId || item.status !== "completed" ||
        typeof item.topicId !== "string" || !/^[A-Z0-9-]{3,30}$/.test(item.topicId) ||
        !["diagnostic", "practice"].includes(item.kind) || !Number.isSafeInteger(item.correctCount) ||
        !Number.isSafeInteger(item.answered) || item.answered < 1 || item.correctCount < 0 || item.correctCount > item.answered ||
        !validUtc(item.completedAt)) throw new StudentAccountError(403, "Sesión no disponible.");
      const existing = db.prepare(`SELECT id,source_session_id AS sourceSessionId,topic_id AS topicId,kind,
        correct_count AS correctCount,answered,completed_at AS completedAt FROM student_progress
        WHERE source_session_id=? AND user_id=?`).get(sessionId, user.id) as StudentProgress | undefined;
      if (existing) { db.exec("COMMIT"); return { ...existing }; }
      const id = randomBytes(16).toString("hex");
      db.prepare(`INSERT INTO student_progress(id,user_id,source_session_id,topic_id,kind,correct_count,answered,completed_at)
        VALUES (?,?,?,?,?,?,?,?)`).run(id, user.id, sessionId, item.topicId, item.kind, item.correctCount, item.answered, item.completedAt);
      db.exec("COMMIT");
      return { id, sourceSessionId: sessionId, topicId: item.topicId, kind: item.kind,
        correctCount: item.correctCount, answered: item.answered, completedAt: item.completedAt };
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  }
  function listProgress(token: string): StudentProgress[] {
    const user = currentStudent(token);
    return (db.prepare(`SELECT id,source_session_id AS sourceSessionId,topic_id AS topicId,kind,correct_count AS correctCount,answered,
      completed_at AS completedAt FROM student_progress WHERE user_id=? ORDER BY completed_at DESC,id DESC LIMIT 200`)
      .all(user.id)) as StudentProgress[];
  }
  function compareProgress(token: string, topicId: string) {
    const user = currentStudent(token);
    if (typeof topicId !== "string" || !/^[A-Z0-9-]{3,30}$/.test(topicId)) {
      throw new StudentAccountError(400, "Tema no válido.");
    }
    const rows = db.prepare(`SELECT id,source_session_id AS sourceSessionId,topic_id AS topicId,kind,correct_count AS correctCount,answered,
      completed_at AS completedAt FROM student_progress WHERE user_id=? AND topic_id=?
      ORDER BY completed_at DESC,id DESC LIMIT 2`).all(user.id, topicId) as StudentProgress[];
    if (rows.length < 2) return {
      status: "insufficient" as const,
      message: "Aún no hay sesiones suficientes para comparar tu progreso",
      current: rows[0] ?? null,
    };
    const [current, previous] = rows;
    return { status: "ready" as const, current, previous,
      percentagePointChange: Math.round((current.correctCount / current.answered - previous.correctCount / previous.answered) * 100) };
  }
  return { issueAuthorization, register, registerAuthorized, login, currentStudent, logout, revoke,
    recordCompletedSession, listProgress, compareProgress, close: () => db.close() };
}
