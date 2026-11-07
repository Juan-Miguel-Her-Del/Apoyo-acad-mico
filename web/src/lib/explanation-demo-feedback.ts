import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { AuthError } from "./auth.ts";
import { topics } from "./catalog.ts";
import { getStudyDemo, pickStudyChapter } from "./study-demo.ts";
import { getDiagnostic } from "./diagnostic.ts";
import { demoExplanationId } from "./explanation-id.ts";
import type { ExplanationRating } from "./explanation-followup.ts";

export type DemoFeedback = {
  topicId: string;
  explanationId: string;
  value: ExplanationRating;
  updatedAt: string;
};

export { demoExplanationId } from "./explanation-id.ts";

function validDemoTopic(topicId: unknown): string {
  if (typeof topicId !== "string" || topicId.length > 80) throw new AuthError(400, "Tema no válido.");
  const topic = topics.find((item) => item.id === topicId);
  if (!topic || !getStudyDemo(topic.gradeId, topic.subjectId, topic.id)) throw new AuthError(400, "Tema no válido.");
  return topicId;
}

function validExplanationId(topicId: string, explanationId: unknown): string {
  if (typeof explanationId !== "string" || explanationId.length > 240) throw new AuthError(400, "Valoración no válida.");
  if (explanationId === demoExplanationId(topicId)) return explanationId;
  const topic = topics.find((item) => item.id === topicId)!;
  const lesson = getStudyDemo(topic.gradeId, topic.subjectId, topicId)!;
  const diagnostic = getDiagnostic(topic.gradeId, topic.subjectId, topicId, "demo");
  if (diagnostic.status !== 200) throw new AuthError(400, "Valoración no válida.");
  for (const skill of new Set(diagnostic.questions.map((question) => question.skill))) {
    if (explanationId === demoExplanationId(topicId, skill, 0)) return explanationId;
    const chapter = pickStudyChapter(lesson, skill);
    if (chapter.alternateExample && explanationId === demoExplanationId(topicId, skill, 1)) return explanationId;
  }
  throw new AuthError(400, "Valoración no válida.");
}

export function openDemoFeedbackStore(dbPath = process.env.APOYO_DB_PATH || path.join(process.cwd(), "data", "apoyo.sqlite")) {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS explanation_demo_feedback (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic_id TEXT NOT NULL,
      explanation_id TEXT NOT NULL,
      value TEXT NOT NULL CHECK(value IN ('helped','confused')),
      updated_at TEXT NOT NULL,
      PRIMARY KEY(user_id,explanation_id)
    );`);

  function adult(userId: string) {
    if (!db.prepare("SELECT 1 FROM users WHERE id=? AND status='active' AND adult_confirmed=1").get(userId)) {
      throw new AuthError(401, "Sesión requerida.");
    }
  }
  function get(userId: string, topicId: unknown, explanationId?: unknown): DemoFeedback | null {
    adult(userId);
    const validatedTopic = validDemoTopic(topicId);
    const validatedExplanationId = validExplanationId(validatedTopic,
      explanationId === undefined || explanationId === null ? demoExplanationId(validatedTopic) : explanationId);
    const row = db.prepare(`SELECT topic_id AS topicId,explanation_id AS explanationId,
      value,updated_at AS updatedAt FROM explanation_demo_feedback
      WHERE user_id=? AND topic_id=? AND explanation_id=?`)
      .get(userId, validatedTopic, validatedExplanationId) as DemoFeedback | undefined;
    return row ?? null;
  }
  function put(userId: string, body: unknown): DemoFeedback {
    adult(userId);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError(400, "Valoración no válida.");
    const { topicId, explanationId, value } = body as Record<string, unknown>;
    const validatedTopic = validDemoTopic(topicId);
    const validatedExplanationId = validExplanationId(validatedTopic, explanationId);
    if (value !== "helped" && value !== "confused") {
      throw new AuthError(400, "Valoración no válida.");
    }
    const updatedAt = new Date().toISOString();
    db.prepare(`INSERT INTO explanation_demo_feedback(user_id,topic_id,explanation_id,value,updated_at)
      VALUES (?,?,?,?,?) ON CONFLICT(user_id,explanation_id)
      DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`)
      .run(userId, validatedTopic, validatedExplanationId, value, updatedAt);
    return get(userId, validatedTopic, validatedExplanationId)!;
  }
  return { get, put, close: () => db.close() };
}

let singleton: ReturnType<typeof openDemoFeedbackStore> | undefined;
export function demoFeedbackStore() { return singleton ??= openDemoFeedbackStore(); }
