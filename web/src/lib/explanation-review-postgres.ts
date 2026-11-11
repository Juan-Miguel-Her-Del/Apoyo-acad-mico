import { postgres } from "./postgres.ts";
import type { ExplanationReviewEvent } from "./explanation-review.ts";

export function openPostgresExplanationReviewStore() {
  return {
    async record(event: ExplanationReviewEvent) {
      await postgres.prepare(`INSERT INTO explanation_review_events
        (topic_id,subskill_id,source_version,example_index,reason,created_at)
        VALUES (?,?,?,?,?,?)`).run(event.topicId, event.subskillId, event.sourceVersion,
        event.exampleIndex, event.reason, new Date().toISOString());
    },
    async list() {
      return postgres.prepare(`SELECT topic_id AS topicId, subskill_id AS subskillId,
        source_version AS sourceVersion, example_index AS exampleIndex,
        reason, created_at AS createdAt FROM explanation_review_events ORDER BY id DESC`).all();
    },
    close: async () => undefined,
  };
}
