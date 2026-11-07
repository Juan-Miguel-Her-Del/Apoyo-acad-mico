import test from "node:test";
import assert from "node:assert/strict";
import { geminiExplanationProvider } from "../src/lib/explanation-gemini.ts";
import { configuredExplanationProvider } from "../src/lib/explanation-provider.ts";
import { explanationLevelForGrade } from "../src/lib/explanation-adaptation.ts";

const input = {
  gradeId: "G05", subjectId: "MAT", topicId: "G05-MAT", topicName: "Fracciones",
  subskillId: "G05-MAT:fracciones", sourceVersion: "teacher-v1",
  explanation: "Dos fracciones son equivalentes cuando representan la misma parte de un todo.",
  example: "Un medio y dos cuartos representan la misma cantidad de una unidad dividida.",
  reference: "Fuente revisada", level: explanationLevelForGrade("G05"), exampleIndex: 0,
};
const modelOutput = {
  topicId: input.topicId, subskillId: input.subskillId, sourceVersion: input.sourceVersion,
  explanation: input.explanation, example: input.example,
};

test("adaptador Gemini usa Interactions sin estado, clave de servidor y solo texto curricular", async () => {
  const oldKey = process.env.GEMINI_API_KEY;
  const oldOpenAI = process.env.OPENAI_API_KEY;
  const oldFetch = globalThis.fetch;
  try {
    process.env.GEMINI_API_KEY = "server-gemini-test-key";
    process.env.OPENAI_API_KEY = "server-openai-test-key";
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "https://generativelanguage.googleapis.com/v1beta/interactions");
      assert.equal(options.headers["x-goog-api-key"], "server-gemini-test-key");
      assert.equal(options.cache, "no-store");
      const request = JSON.parse(options.body);
      assert.equal(request.model, "gemini-3.5-flash-lite");
      assert.equal(request.store, false);
      assert.equal(request.response_format.mime_type, "application/json");
      assert.equal(request.response_format.schema.type, "object");
      assert.equal(JSON.parse(request.input).approvedText.explanation, input.explanation);
      assert.equal(JSON.parse(request.input).level.gradeId, "G05");
      assert.equal(options.body.includes("userId"), false);
      assert.equal(options.body.includes("email"), false);
      return Response.json({ status: "completed", steps: [
        { type: "thought", content: [] },
        { type: "model_output", content: [{ type: "text", text: JSON.stringify(modelOutput) }] },
      ] });
    };
    assert.deepEqual(await configuredExplanationProvider(input), modelOutput);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
    if (oldOpenAI === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = oldOpenAI;
  }
});

test("Gemini sin clave o con salida incompleta no devuelve explicación", async () => {
  const oldKey = process.env.GEMINI_API_KEY;
  const oldFetch = globalThis.fetch;
  try {
    delete process.env.GEMINI_API_KEY;
    await assert.rejects(geminiExplanationProvider(input), /key unavailable/);
    process.env.GEMINI_API_KEY = "server-gemini-test-key";
    globalThis.fetch = async () => Response.json({ status: "incomplete", steps: [] });
    await assert.rejects(geminiExplanationProvider(input), /incomplete/);
    globalThis.fetch = async () => Response.json({ status: "completed", steps: [
      { type: "model_output", content: [{ type: "text", text: "not json" }] },
    ] });
    await assert.rejects(geminiExplanationProvider(input), SyntaxError);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
  }
});

test("borrador provisional se identifica como no revisado ante Gemini", async () => {
  const oldKey = process.env.GEMINI_API_KEY;
  const oldFetch = globalThis.fetch;
  try {
    process.env.GEMINI_API_KEY = "server-gemini-test-key";
    globalThis.fetch = async (_url, options) => {
      const request = JSON.parse(options.body);
      assert.equal(JSON.parse(request.input).sourceStatus, "provisional");
      assert.match(request.system_instruction, /borrador educativo no revisado/);
      assert.equal(request.store, false);
      return Response.json({ status: "completed", steps: [
        { type: "model_output", content: [{ type: "text", text: JSON.stringify(modelOutput) }] },
      ] });
    };
    assert.deepEqual(await geminiExplanationProvider({ ...input, sourceStatus: "provisional" }), modelOutput);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
  }
});

test("Gemini reintenta un 503 temporal y no reintenta errores permanentes", async () => {
  const oldKey = process.env.GEMINI_API_KEY;
  const oldFetch = globalThis.fetch;
  try {
    process.env.GEMINI_API_KEY = "server-gemini-test-key";
    let requests = 0;
    globalThis.fetch = async () => {
      requests += 1;
      return requests === 1
        ? Response.json({ error: { code: 503 } }, { status: 503 })
        : Response.json({ status: "completed", steps: [
          { type: "model_output", content: [{ type: "text", text: JSON.stringify(modelOutput) }] },
        ] });
    };
    assert.deepEqual(await geminiExplanationProvider(input), modelOutput);
    assert.equal(requests, 2);
    globalThis.fetch = async () => { requests += 1; return Response.json({ error: { code: 403 } }, { status: 403 }); };
    await assert.rejects(geminiExplanationProvider(input), /Gemini unavailable/);
    assert.equal(requests, 3);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = oldKey;
  }
});
