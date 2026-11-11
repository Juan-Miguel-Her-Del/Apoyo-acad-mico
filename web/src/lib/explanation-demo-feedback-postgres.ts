import { AuthError } from "./auth-error.ts";
import { postgres } from "./postgres.ts";
import { demoExplanationId } from "./explanation-id.ts";
import { validDemoTopic, validExplanationId, type DemoFeedback } from "./explanation-demo-feedback.ts";

export function openPostgresDemoFeedbackStore() {
  async function adult(userId: string) {
    if (!await postgres.prepare("SELECT 1 FROM users WHERE id=? AND status='active' AND adult_confirmed=1").get(userId)) {
      throw new AuthError(401, "Sesión requerida.");
    }
  }

  async function get(userId: string, topicId: unknown, explanationId?: unknown): Promise<DemoFeedback | null> {
    await adult(userId);
    const validatedTopic = validDemoTopic(topicId);
    const validatedExplanationId = validExplanationId(validatedTopic,
      explanationId === undefined || explanationId === null ? demoExplanationId(validatedTopic) : explanationId);
    const row = await postgres.prepare(`SELECT topic_id AS topicId,explanation_id AS explanationId,
      value,updated_at AS updatedAt FROM explanation_demo_feedback
      WHERE user_id=? AND topic_id=? AND explanation_id=?`)
      .get<DemoFeedback>(userId, validatedTopic, validatedExplanationId);
    return row ?? null;
  }

  async function put(userId: string, body: unknown): Promise<DemoFeedback> {
    await adult(userId);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new AuthError(400, "Valoración no válida.");
    const { topicId, explanationId, value } = body as Record<string, unknown>;
    const validatedTopic = validDemoTopic(topicId);
    const validatedExplanationId = validExplanationId(validatedTopic, explanationId);
    if (value !== "helped" && value !== "confused") throw new AuthError(400, "Valoración no válida.");
    const updatedAt = new Date().toISOString();
    await postgres.prepare(`INSERT INTO explanation_demo_feedback(user_id,topic_id,explanation_id,value,updated_at)
      VALUES (?,?,?,?,?) ON CONFLICT(user_id,explanation_id)
      DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`)
      .run(userId, validatedTopic, validatedExplanationId, value, updatedAt);
    return (await get(userId, validatedTopic, validatedExplanationId))!;
  }

  return { get, put, close: async () => undefined };
}
