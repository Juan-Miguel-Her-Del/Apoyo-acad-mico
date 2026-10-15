import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export type ExplanationReviewEvent = {
  topicId: string; subskillId: string; sourceVersion: string;
  exampleIndex: number; reason: "invalid_provider_response" | "duplicate_example";
};

// Registra metadatos para revisión, nunca texto generado, credenciales ni identidad.
export function openExplanationReviewStore(
  dbPath = process.env.APOYO_DB_PATH || path.join(process.cwd(), "data", "apoyo.sqlite"),
) {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS explanation_review_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id TEXT NOT NULL, subskill_id TEXT NOT NULL,
      source_version TEXT NOT NULL, example_index INTEGER NOT NULL,
      reason TEXT NOT NULL, created_at TEXT NOT NULL
    );`);
  return {
    record(event: ExplanationReviewEvent) {
      db.prepare(`INSERT INTO explanation_review_events
        (topic_id,subskill_id,source_version,example_index,reason,created_at)
        VALUES (?,?,?,?,?,?)`).run(event.topicId, event.subskillId, event.sourceVersion,
        event.exampleIndex, event.reason, new Date().toISOString());
    },
    list() {
      return db.prepare(`SELECT topic_id AS topicId, subskill_id AS subskillId,
        source_version AS sourceVersion, example_index AS exampleIndex,
        reason, created_at AS createdAt FROM explanation_review_events ORDER BY id DESC`).all();
    },
    close() { db.close(); },
  };
}

let singleton: ReturnType<typeof openExplanationReviewStore> | null = null;
export function explanationReviewStore() { return singleton ??= openExplanationReviewStore(); }
