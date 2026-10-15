import test from "node:test";
import assert from "node:assert/strict";
import { correctionExplanation } from "../src/lib/practice-feedback.ts";

test("una corrección sin evidencia de revisión queda pendiente y no entrega justificación", () => {
  assert.deepEqual(correctionExplanation("Una explicación provisional", null), {
    status: "pending-review", explanation: null,
  });
  assert.deepEqual(correctionExplanation("Una explicación provisional", {
    reviewer: "", approvedAt: "2026-10-15", evidence: "archivo",
  }), { status: "pending-review", explanation: null });
});

test("una corrección documentada puede entregar la explicación revisada", () => {
  assert.deepEqual(correctionExplanation("  Una razón revisada.  ", {
    reviewer: "docente-de-prueba", approvedAt: "2026-10-15T13:00:00Z", evidence: "acta-de-prueba",
  }), { status: "approved", explanation: "Una razón revisada." });
});
