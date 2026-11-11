import { AsyncLocalStorage } from "node:async_hooks";
import pg, { type QueryResultRow } from "pg";

const { Pool } = pg;
// Identificadores y épocas en milisegundos siguen dentro del rango seguro de JS.
pg.types.setTypeParser(20, (value) => Number(value));

const schema = `
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
  token_hash TEXT NOT NULL UNIQUE, expires_at BIGINT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS email_verification_limits (
  email_hash TEXT PRIMARY KEY, window_start BIGINT NOT NULL, attempts INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_by_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS password_reset_limits (
  email_hash TEXT PRIMARY KEY, window_start BIGINT NOT NULL, attempts INTEGER NOT NULL
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
  total INTEGER NOT NULL CHECK(total > 0), started_at TEXT NOT NULL, completed_at TEXT,
  target_difficulty INTEGER NOT NULL DEFAULT 1,
  difficulty_fallback INTEGER NOT NULL DEFAULT 0,
  bank_version TEXT NOT NULL DEFAULT 'legacy-demo-v1'
);
CREATE INDEX IF NOT EXISTS practice_sessions_by_user ON practice_sessions(user_id, started_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS practice_one_open_session
  ON practice_sessions(user_id,topic_id) WHERE status='open';
CREATE TABLE IF NOT EXISTS practice_answers (
  session_id TEXT NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL, option_id TEXT NOT NULL,
  correct INTEGER NOT NULL CHECK(correct IN (0,1)),
  correct_option_id TEXT NOT NULL, explanation TEXT NOT NULL, answered_at TEXT NOT NULL,
  skill_id TEXT NOT NULL DEFAULT '', PRIMARY KEY(session_id,question_id)
);
CREATE TABLE IF NOT EXISTS practice_session_questions (
  session_id TEXT NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, question_id TEXT NOT NULL, snapshot_json TEXT NOT NULL,
  PRIMARY KEY(session_id,position), UNIQUE(session_id,question_id)
);
CREATE TABLE IF NOT EXISTS diagnostic_attempts (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
);
CREATE TABLE IF NOT EXISTS explanation_demo_feedback (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL, explanation_id TEXT NOT NULL,
  value TEXT NOT NULL CHECK(value IN ('helped','confused')),
  updated_at TEXT NOT NULL, PRIMARY KEY(user_id,explanation_id)
);
CREATE TABLE IF NOT EXISTS explanation_review_events (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  topic_id TEXT NOT NULL, subskill_id TEXT NOT NULL,
  source_version TEXT NOT NULL, example_index INTEGER NOT NULL,
  reason TEXT NOT NULL, created_at TEXT NOT NULL
);`;

type QueryExecutor = {
  query<T extends QueryResultRow = QueryResultRow>(sql: string, values?: unknown[]): Promise<{ rows: T[]; rowCount?: number | null }>;
};
type TestBackend = QueryExecutor & {
  schema(sql: string): Promise<void>;
  transaction<T>(work: (executor: QueryExecutor) => Promise<T>): Promise<T>;
};

let pool: InstanceType<typeof Pool> | undefined;
let initialized: Promise<void> | undefined;
let testBackend: TestBackend | undefined;
const transactionClient = new AsyncLocalStorage<QueryExecutor>();

// Solo se usa con un PostgreSQL aislado en las pruebas; nunca se configura desde variables HTTP.
export function setPostgresTestBackend(backend: TestBackend | undefined) {
  testBackend = backend;
  initialized = undefined;
}

function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL no configurada.");
  return pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
}

async function ready() {
  if (!initialized) {
    initialized = (testBackend ? testBackend.schema(schema) : getPool().query(schema).then(() => undefined)).catch((error: unknown) => {
      initialized = undefined;
      throw error;
    });
  }
  await initialized;
}

function postgresSql(input: string) {
  let sql = input.trim();
  if (/^INSERT OR IGNORE\s+INTO\b/i.test(sql)) {
    sql = sql.replace(/^INSERT OR IGNORE\s+INTO\b/i, "INSERT INTO") + " ON CONFLICT DO NOTHING";
  }
  sql = sql.replace(/\bMAX\(0,attempts-1\)/g, "GREATEST(0,attempts-1)");
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function mappedRows<T extends QueryResultRow>(sql: string, rows: T[]): T[] {
  const aliases = [...sql.matchAll(/\bAS\s+([a-z][a-z0-9]*[A-Z][a-zA-Z0-9]*)\b/g)].map((match) => match[1]);
  if (!aliases.length) return rows;
  return rows.map((row) => {
    const copy: QueryResultRow = { ...row };
    for (const alias of aliases) {
      const lower = alias.toLowerCase();
      if (lower in copy && !(alias in copy)) {
        copy[alias] = copy[lower];
        delete copy[lower];
      }
    }
    return copy as T;
  });
}

async function query<T extends QueryResultRow>(sql: string, values: unknown[] = []) {
  await ready();
  const executor = transactionClient.getStore() ?? testBackend ?? getPool();
  const result = await executor.query<T>(postgresSql(sql), values);
  return { rows: mappedRows(sql, result.rows), changes: result.rowCount ?? 0 };
}

export const postgres = {
  prepare(sql: string) {
    return {
      async get<T extends QueryResultRow = QueryResultRow>(...values: unknown[]): Promise<T | undefined> {
        return (await query<T>(sql, values)).rows[0];
      },
      async all<T extends QueryResultRow = QueryResultRow>(...values: unknown[]): Promise<T[]> {
        return (await query<T>(sql, values)).rows;
      },
      async run(...values: unknown[]): Promise<{ changes: number }> {
        const result = await query(sql, values);
        return { changes: result.changes };
      },
    };
  },
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    await ready();
    if (testBackend) {
      return testBackend.transaction((executor) => transactionClient.run(executor, work));
    }
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const result = await transactionClient.run(client, work);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
