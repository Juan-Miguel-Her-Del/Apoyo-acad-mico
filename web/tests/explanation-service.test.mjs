import test from "node:test";
import assert from "node:assert/strict";
import { topics } from "../src/lib/catalog.ts";
import { generateExplanation } from "../src/lib/explanation-service.ts";
import { handleExplanationRequest } from "../src/lib/explanation-http.ts";
import { configuredExplanationProvider } from "../src/lib/explanation-provider.ts";

const attemptId = "a".repeat(32);
const subskillId = "G05-MAT:fracciones";
const source = {
  topicId: "G05-MAT", subskillId, version: "teacher-v1", approvalEvidenceId: "fixture-approval",
  reviewedBy: "fixture-teacher", reviewedAt: "2026-10-01", reference: "Guía revisada de fracciones",
  explanation: "Dos fracciones son equivalentes cuando representan la misma parte de un todo.",
  example: "Un medio y dos cuartos representan la misma cantidad de una unidad dividida.",
};
const catalog = topics.map((topic) => topic.id === source.topicId
  ? { ...topic, approvedForPublication: true, explanationApproved: true, validatedQuestionCount: 4 } : topic);
const approvedAttempt = {
  attempt: { gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT", status: "completed", mode: "published", validation: "approved" },
  answers: [
    { questionId: "q1", skill: subskillId, correct: false },
    { questionId: "q2", skill: subskillId, correct: false },
  ],
};
const provider = async (input) => ({
  topicId: input.topicId, subskillId: input.subskillId, sourceVersion: input.sourceVersion,
  explanation: input.explanation, example: input.example,
});

test("fuente revisada y dificultad comprobada permiten extractos literales con referencia del servidor", async () => {
  const result = await generateExplanation({ attempt: approvedAttempt, subskillId, source, provider, catalog });
  assert.equal(result.explanation, source.explanation);
  assert.equal(result.example, source.example);
  assert.equal(result.reference, source.reference);
  assert.equal(result.approvalEvidenceId, "fixture-approval");
});

test("sin aprobación curricular, intento demo o evidencia suficiente no se llama al proveedor", async () => {
  let calls = 0;
  const counted = async (input) => { calls++; return provider(input); };
  await assert.rejects(generateExplanation({ attempt: approvedAttempt, subskillId, source, provider: counted }),
    (error) => error.code === "content_not_approved" && error.status === 409);
  await assert.rejects(generateExplanation({ attempt: { ...approvedAttempt, attempt: { ...approvedAttempt.attempt, mode: "demo" } }, subskillId, source, provider: counted, catalog }),
    (error) => error.code === "academic_review_pending");
  await assert.rejects(generateExplanation({ attempt: { ...approvedAttempt, answers: approvedAttempt.answers.slice(0, 1) }, subskillId, source, provider: counted, catalog }),
    (error) => error.code === "insufficient_evidence");
  await assert.rejects(generateExplanation({ attempt: approvedAttempt, subskillId, source: undefined, provider: counted, catalog }),
    (error) => error.code === "source_unavailable");
  assert.equal(calls, 0);
});

test("rechaza contenido inventado, referencia cruzada y falla del proveedor con reintento", async () => {
  const args = { attempt: approvedAttempt, subskillId, source, catalog };
  await assert.rejects(generateExplanation({ ...args, provider: async (input) => ({
    topicId: input.topicId, subskillId: input.subskillId, sourceVersion: input.sourceVersion,
    explanation: "Una explicación creada por IA sin respaldo del material revisado.", example: input.example,
  }) }), (error) => error.code === "invalid_provider_response" && error.retryable);
  await assert.rejects(generateExplanation({ ...args, provider: async (input) => ({
    topicId: "G10-MAT", subskillId: input.subskillId, sourceVersion: input.sourceVersion,
    explanation: input.explanation, example: input.example,
  }) }), (error) => error.code === "invalid_provider_response");
  await assert.rejects(generateExplanation({ ...args, provider: async () => { throw new Error("private-token"); } }),
    (error) => error.code === "provider_unavailable" && !error.message.includes("private-token"));
});

test("contrato HTTP exige sesión y origen, rechaza demo y no filtra salida del proveedor", async () => {
  const old = process.env.APOYO_ENABLE_ADULT_ACCOUNTS;
  process.env.APOYO_ENABLE_ADULT_ACCOUNTS = "true";
  try {
    let calls = 0;
    const deps = {
      userId: () => "adult-1", attempt: (_userId, id) => {
        assert.equal(id, attemptId);
        return approvedAttempt;
      },
      source: () => source, catalog,
      provider: async (input) => { calls++; return provider(input); },
    };
    const request = (origin = "https://example.test") => new Request("https://example.test/api/explanation", {
      method: "POST", headers: { origin, host: "example.test", "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, subskillId }),
    });
    const noSession = await handleExplanationRequest(request(), { ...deps, userId: () => null });
    assert.equal(noSession.status, 401);
    const crossOrigin = await handleExplanationRequest(request("https://evil.test"), deps);
    assert.equal(crossOrigin.status, 403);
    const pending = await handleExplanationRequest(request(), { ...deps, attempt: () => ({
      ...approvedAttempt, attempt: { ...approvedAttempt.attempt, mode: "demo" },
    }) });
    assert.equal(pending.status, 409);
    assert.equal((await pending.json()).retryable, false);
    assert.equal(calls, 0);
    const valid = await handleExplanationRequest(request(), deps);
    assert.equal(valid.status, 200);
    assert.equal(valid.headers.get("cache-control"), "no-store");
    assert.equal((await valid.json()).example, source.example);
    assert.equal(calls, 1);
  } finally {
    if (old === undefined) delete process.env.APOYO_ENABLE_ADULT_ACCOUNTS;
    else process.env.APOYO_ENABLE_ADULT_ACCOUNTS = old;
  }
});

test("adaptador HTTP usa solo configuración del servidor, limita tamaño y no acepta URL insegura", async () => {
  const oldUrl = process.env.APOYO_EXPLANATION_PROVIDER_URL;
  const oldToken = process.env.APOYO_EXPLANATION_PROVIDER_TOKEN;
  const oldFetch = globalThis.fetch;
  try {
    process.env.APOYO_EXPLANATION_PROVIDER_URL = "https://provider.example/explain";
    process.env.APOYO_EXPLANATION_PROVIDER_TOKEN = "secret-in-server";
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "https://provider.example/explain");
      assert.equal(options.headers.Authorization, "Bearer secret-in-server");
      assert.equal(JSON.parse(options.body).approvedText.example, source.example);
      assert.equal(options.cache, "no-store");
      return new Response(JSON.stringify({ topicId: source.topicId }), { status: 200 });
    };
    const input = {
      gradeId: "G05", subjectId: "MAT", topicId: source.topicId, topicName: "Fracciones",
      subskillId, sourceVersion: source.version, explanation: source.explanation,
      example: source.example, reference: source.reference,
    };
    assert.deepEqual(await configuredExplanationProvider(input), { topicId: source.topicId });
    process.env.APOYO_EXPLANATION_PROVIDER_URL = "http://provider.example/explain";
    await assert.rejects(configuredExplanationProvider(input), /Invalid provider URL/);
    process.env.APOYO_EXPLANATION_PROVIDER_URL = "https://provider.example/explain";
    globalThis.fetch = async () => new Response("x".repeat(8193), { status: 200 });
    await assert.rejects(configuredExplanationProvider(input), /response too large/);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.APOYO_EXPLANATION_PROVIDER_URL;
    else process.env.APOYO_EXPLANATION_PROVIDER_URL = oldUrl;
    if (oldToken === undefined) delete process.env.APOYO_EXPLANATION_PROVIDER_TOKEN;
    else process.env.APOYO_EXPLANATION_PROVIDER_TOKEN = oldToken;
  }
});
